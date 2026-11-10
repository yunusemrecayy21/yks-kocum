import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Building2,
  BookOpen,
  Lock,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  GraduationCap,
  SlidersHorizontal
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';

const validateNewPassword = (password: string, confirmPassword: string): string[] => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.');
  }
  if (!/[A-ZÇĞİÖŞÜ]/.test(password)) {
    errors.push('Şifre en az 1 büyük harf içermelidir.');
  }
  if (!/[a-zçğıöşü]/.test(password)) {
    errors.push('Şifre en az 1 küçük harf içermelidir.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az 1 rakam içermelidir.');
  }
  if (!/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü\s]/.test(password)) {
    errors.push('Şifre en az 1 özel karakter (sembol, örn: !@#$%.*) içermelidir.');
  }
  if (confirmPassword.length > 0 && password !== confirmPassword) {
    errors.push('Girilen şifreler birbiriyle eşleşmiyor.');
  }

  return errors;
};

export const ProfilePage: React.FC = () => {
  const {
    user,
    onboardingProfile,
    saveOnboardingProfile,
    refreshProfile,
    changePassword
  } = useAuth();

  // Target University & Department state (Firestore userProfiles)
  const [targetUniversity, setTargetUniversity] = useState<string>(
    onboardingProfile?.targetUniversity ?? ''
  );
  const [targetDepartment, setTargetDepartment] = useState<string>(
    onboardingProfile?.targetDepartment ?? ''
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Update state (Firebase Auth updatePassword)
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch fresh userProfiles document from Firestore on page load
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        const fetched = await refreshProfile();
        if (isMounted && fetched) {
          setTargetUniversity(fetched.targetUniversity);
          setTargetDepartment(fetched.targetDepartment);
        }
      } catch (err) {
        console.error('Firestore userProfiles fetch error:', err);
        if (isMounted) {
          setProfileError('Profil verileri Firestore üzerinden yüklenirken bir hata oluştu.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;
    setProfileSuccess(null);
    setProfileError(null);

    if (!targetUniversity.trim() || !targetDepartment.trim()) {
      setProfileError('Lütfen hem Hedef Üniversite hem de Hedef Bölüm alanlarını doldurun.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await saveOnboardingProfile({
        gradeLevel: onboardingProfile?.gradeLevel ?? '12. Sınıf',
        studyField: onboardingProfile?.studyField ?? 'Sayısal',
        targetUniversity: targetUniversity.trim(),
        targetDepartment: targetDepartment.trim()
      });
      setProfileSuccess('Hedef üniversite ve bölüm bilgileriniz Firestore veritabanına kaydedildi.');
    } catch (err) {
      console.error('Firestore userProfiles save error:', err);
      setProfileError('Hedef bilgileri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const passwordValidationErrors = validateNewPassword(newPassword, confirmPassword);
  const isPasswordMatchValid =
    newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordFormValid =
    passwordValidationErrors.length === 0 && isPasswordMatchValid;
  const showPasswordRules =
    !isPasswordFormValid &&
    (newPassword.length > 0 || confirmPassword.length > 0 || passwordSubmitAttempted);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingPassword) return;
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!isPasswordFormValid) {
      setPasswordSubmitAttempted(true);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await changePassword(newPassword);
      if (!result.success) {
        setPasswordError(result.error ?? 'Şifre güncellenemedi.');
        return;
      }

      setNewPassword('');
      setConfirmPassword('');
      setPasswordSubmitAttempted(false);
      setPasswordSuccess('Şifreniz Firebase Authentication üzerinde başarıyla güncellendi!');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayUsername = user?.username || 'Öğrenci';
  const initials = displayUsername.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-brand-purple" />
            Profil & Hesap Ayarları
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Hesap bilgilerini görüntüle, hedef üniversite & bölüm tercihini düzenle ve şifreni güncelle.
          </p>
        </div>
      </div>

      {/* Account Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple to-indigo-600 flex items-center justify-center font-extrabold text-xl text-white shadow-lg shadow-brand-purple/25 shrink-0">
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {displayUsername}
                </h2>
                <Badge variant="purple">Aktif Hesap</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <Mail className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight shrink-0" />
                <span className="truncate">{user?.email || '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            {onboardingProfile && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <GraduationCap className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
                <span>
                  {onboardingProfile.gradeLevel} · {onboardingProfile.studyField}
                </span>
              </div>
            )}
            <Link
              to="/onboarding?edit=1"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sınıf / Alan Değiştir</span>
            </Link>
          </div>
        </div>
      </Card>

      {/* Two Column Forms: Target University/Department + Password Update */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Target University & Department (Firestore userProfiles) */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight border border-purple-200 dark:border-brand-purple/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hedef Üniversite & Bölüm
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ana Sayfa motivasyon köşen bu bilgilere göre güncellenir
              </p>
            </div>
          </div>

          {isLoadingProfile ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-7 h-7 text-brand-purple dark:text-brand-purpleLight animate-spin mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hedef bilgileri Firestore'dan yükleniyor...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveTargets} className="space-y-4">
              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Kayıtlı E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="profile-email"
                    type="email"
                    readOnly
                    value={user?.email ?? ''}
                    className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-university"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Hedef Üniversite
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="profile-university"
                    type="text"
                    required
                    placeholder="Örn: Boğaziçi Üniversitesi"
                    value={targetUniversity}
                    onChange={(e) => {
                      setTargetUniversity(e.target.value);
                      setProfileSuccess(null);
                      setProfileError(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-department"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Hedef Bölüm
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="profile-department"
                    type="text"
                    required
                    placeholder="Örn: Bilgisayar Mühendisliği"
                    value={targetDepartment}
                    onChange={(e) => {
                      setTargetDepartment(e.target.value);
                      setProfileSuccess(null);
                      setProfileError(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition"
                  />
                </div>
              </div>

              {profileSuccess && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p>{profileSuccess}</p>
                </div>
              )}

              {profileError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p>{profileError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-purple/20 transition"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Hedefleri Kaydet</span>
                  </>
                )}
              </button>
            </form>
          )}
        </Card>

        {/* Card 2: Change Password (Firebase Auth updatePassword) */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Şifre Değiştir
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hesap güvenliğin için güçlü bir yeni şifre belirle
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Yeni Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Yeni güçlü şifrenizi girin"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordSuccess(null);
                    setPasswordError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
                  aria-label={showNewPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Yeni Şifre (Tekrar)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Yeni şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordSuccess(null);
                    setPasswordError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
                  aria-label={showConfirmPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Validation Hints */}
            {showPasswordRules && (
              <div className="rounded-xl bg-amber-50 dark:bg-gradient-to-r dark:from-rose-500/10 dark:to-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>Şifre gereksinimleri:</span>
                </div>
                <ul className="space-y-0.5 pl-5 list-disc text-[11px] text-rose-700 dark:text-rose-300/95">
                  {passwordValidationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {newPassword.length > 0 && confirmPassword.length === 0 && (
                    <li>Lütfen şifre tekrarını girin.</li>
                  )}
                </ul>
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>{passwordSuccess}</p>
              </div>
            )}

            {passwordError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{passwordError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword}
              aria-disabled={!isPasswordFormValid || isUpdatingPassword}
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
                isPasswordFormValid && !isUpdatingPassword
                  ? 'bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white shadow-lg shadow-brand-purple/20'
                  : 'bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700/80 cursor-not-allowed'
              }`}
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Şifre Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Şifreyi Güncelle</span>
                </>
              )}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};
