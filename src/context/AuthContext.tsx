import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import {
  fetchUserProfile,
  saveUserProfileToFirestore,
  saveUserRecordToFirestore
} from '../services/firestoreService';
import type { AuthUser, UserOnboardingProfile } from '../types';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  onboardingProfile: UserOnboardingProfile | null;
  hasCompletedOnboarding: boolean;
  isTytOnly: boolean;
  register: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateDisplayName: (fullName: string) => Promise<AuthResult>;
  changePassword: (newPassword: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  saveOnboardingProfile: (profile: Omit<UserOnboardingProfile, 'completedAt'>) => Promise<void>;
  refreshProfile: () => Promise<UserOnboardingProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const checkIsTytOnly = (profile: UserOnboardingProfile | null): boolean => {
  if (!profile) return false;
  return (
    profile.gradeLevel === '9. Sınıf' ||
    profile.gradeLevel === '10. Sınıf' ||
    profile.studyField === 'Sadece TYT'
  );
};

const mapFirebaseUser = (fbUser: FirebaseUser): AuthUser => {
  const email = fbUser.email ?? '';
  const cleanDisplayName = fbUser.displayName?.trim() || null;
  const derivedName = cleanDisplayName || 'Öğrenci';

  return {
    uid: fbUser.uid,
    id: fbUser.uid,
    email,
    displayName: cleanDisplayName,
    username: derivedName,
    createdAt: fbUser.metadata.creationTime ?? new Date().toISOString()
  };
};

const translateFirebaseAuthError = (error: unknown): string => {
  const code = (error as { code?: string })?.code ?? '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın veya farklı bir e-posta deneyin.';
    case 'auth/invalid-email':
      return 'Lütfen geçerli bir e-posta adresi girin.';
    case 'auth/missing-email':
      return 'Lütfen e-posta adresinizi girin.';
    case 'auth/weak-password':
      return 'Şifreniz çok zayıf. En az 6 karakter uzunluğunda güçlü bir şifre belirleyin.';
    case 'auth/user-not-found':
      return 'Bu e-posta adresine kayıtlı bir hesap bulunamadı. Lütfen önce kayıt olun.';
    case 'auth/wrong-password':
      return 'Girdiğiniz şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
    case 'auth/invalid-credential':
      return 'E-posta adresi veya şifre hatalı. Bilgilerinizi kontrol edip tekrar deneyin.';
    case 'auth/too-many-requests':
      return 'Çok fazla başarısız giriş denemesi yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı kurulamadı. Lütfen bağlantınızı kontrol edin.';
    case 'auth/operation-not-allowed':
      return 'Firebase Console üzerinde E-posta/Şifre ile giriş yöntemi henüz etkinleştirilmemiş.';
    case 'auth/requires-recent-login':
      return 'Güvenlik nedeniyle şifrenizi güncellemek için lütfen çıkış yapıp tekrar giriş yaptıktan sonra yeniden deneyin.';
    default:
      return 'Kimlik doğrulama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<UserOnboardingProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setOnboardingProfile(null);
        setIsAuthLoading(false);
        return;
      }

      const mappedUser = mapFirebaseUser(firebaseUser);
      setUser(mappedUser);

      try {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setOnboardingProfile(profile);
      } catch (err) {
        console.error('Firestore profile fetch error:', err);
        setOnboardingProfile(null);
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResult> => {
    try {
      const cleanEmail = email.trim();
      const cleanFullName = fullName.trim();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      if (cleanFullName) {
        await updateProfile(userCredential.user, {
          displayName: cleanFullName
        });
        setUser(mapFirebaseUser(userCredential.user));
      }

      try {
        await saveUserRecordToFirestore(userCredential.user.uid, {
          email: cleanEmail,
          fullName: cleanFullName
        });
      } catch (firestoreError) {
        console.error('Firestore users save error:', firestoreError);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: translateFirebaseAuthError(error)
      };
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: translateFirebaseAuthError(error)
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: translateFirebaseAuthError(error)
      };
    }
  };

  const updateDisplayName = async (fullName: string): Promise<AuthResult> => {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Aktif kullanıcı oturumu bulunamadı. Lütfen yeniden giriş yapın.'
      };
    }

    const cleanFullName = fullName.trim();
    if (cleanFullName.length < 2) {
      return {
        success: false,
        error: 'Lütfen en az 2 karakterden oluşan bir Ad Soyad girin.'
      };
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: cleanFullName
      });
      setUser(mapFirebaseUser(auth.currentUser));

      try {
        await saveUserRecordToFirestore(auth.currentUser.uid, {
          email: auth.currentUser.email ?? '',
          fullName: cleanFullName
        });
      } catch (firestoreError) {
        console.error('Firestore users update error:', firestoreError);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: translateFirebaseAuthError(error)
      };
    }
  };

  const changePassword = async (newPassword: string): Promise<AuthResult> => {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Aktif kullanıcı oturumu bulunamadı. Lütfen yeniden giriş yapın.'
      };
    }
    try {
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: translateFirebaseAuthError(error)
      };
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const saveOnboardingProfile = async (
    profileData: Omit<UserOnboardingProfile, 'completedAt'>
  ): Promise<void> => {
    if (!user) return;
    const fullProfile: UserOnboardingProfile = {
      ...profileData,
      targetUniversity: profileData.targetUniversity.trim(),
      targetDepartment: profileData.targetDepartment.trim(),
      completedAt: new Date().toISOString()
    };

    await saveUserProfileToFirestore(user.uid, fullProfile);
    setOnboardingProfile(fullProfile);
  };

  const refreshProfile = async (): Promise<UserOnboardingProfile | null> => {
    if (!user) return null;
    const profile = await fetchUserProfile(user.uid);
    setOnboardingProfile(profile);
    return profile;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAuthLoading,
        onboardingProfile,
        hasCompletedOnboarding: Boolean(onboardingProfile),
        isTytOnly: checkIsTytOnly(onboardingProfile),
        register,
        login,
        resetPassword,
        updateDisplayName,
        changePassword,
        logout,
        saveOnboardingProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
