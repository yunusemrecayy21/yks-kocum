import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, StoredUserRecord, UserOnboardingProfile } from '../types';

const USERS_STORAGE_KEY = 'yks_auth_users';
const SESSION_STORAGE_KEY = 'yks_auth_session';
const PROFILE_STORAGE_PREFIX = 'yks_onboarding_profile_';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  onboardingProfile: UserOnboardingProfile | null;
  hasCompletedOnboarding: boolean;
  isTytOnly: boolean;
  register: (username: string, password: string) => AuthResult;
  login: (username: string, password: string) => AuthResult;
  logout: () => void;
  saveOnboardingProfile: (profile: Omit<UserOnboardingProfile, 'completedAt'>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredUsers = (): StoredUserRecord[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readStoredSession = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === 'string' && typeof parsed.id === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const readOnboardingProfile = (userId: string): UserOnboardingProfile | null => {
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.gradeLevel === 'string' &&
      typeof parsed.studyField === 'string' &&
      typeof parsed.targetUniversity === 'string' &&
      typeof parsed.targetDepartment === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const checkIsTytOnly = (profile: UserOnboardingProfile | null): boolean => {
  if (!profile) return false;
  return (
    profile.gradeLevel === '9. Sınıf' ||
    profile.gradeLevel === '10. Sınıf' ||
    profile.studyField === 'Sadece TYT'
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredSession());
  const [onboardingProfile, setOnboardingProfile] = useState<UserOnboardingProfile | null>(() => {
    const session = readStoredSession();
    return session ? readOnboardingProfile(session.id) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [user]);

  const register = (username: string, password: string): AuthResult => {
    const trimmedUsername = username.trim();
    const users = readStoredUsers();

    const exists = users.some(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (exists) {
      return {
        success: false,
        error: 'Bu kullanıcı adı zaten kayıtlı. Lütfen farklı bir kullanıcı adı seçin.'
      };
    }

    const newUser: StoredUserRecord = {
      id: Date.now().toString(),
      username: trimmedUsername,
      password,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
    return { success: true };
  };

  const login = (username: string, password: string): AuthResult => {
    const trimmedUsername = username.trim();
    const users = readStoredUsers();

    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (!matchedUser || matchedUser.password !== password) {
      return {
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı. Kayıtlı değilseniz lütfen önce kayıt olun.'
      };
    }

    const sessionUser: AuthUser = {
      id: matchedUser.id,
      username: matchedUser.username,
      createdAt: matchedUser.createdAt
    };

    setUser(sessionUser);
    setOnboardingProfile(readOnboardingProfile(sessionUser.id));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setOnboardingProfile(null);
  };

  const saveOnboardingProfile = (profileData: Omit<UserOnboardingProfile, 'completedAt'>) => {
    if (!user) return;
    const fullProfile: UserOnboardingProfile = {
      ...profileData,
      targetUniversity: profileData.targetUniversity.trim(),
      targetDepartment: profileData.targetDepartment.trim(),
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${user.id}`, JSON.stringify(fullProfile));
    setOnboardingProfile(fullProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        onboardingProfile,
        hasCompletedOnboarding: Boolean(onboardingProfile),
        isTytOnly: checkIsTytOnly(onboardingProfile),
        register,
        login,
        logout,
        saveOnboardingProfile
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
