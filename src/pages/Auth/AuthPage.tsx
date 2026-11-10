import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  User,
  UserPlus,
  AlertTriangle,
  Sparkles,
  Loader2,
  KeyRound,
  CheckCircle2,
  Send,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ValidationResult {
  isValid: boolean;
  missingRules: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateCredentials = (
  fullName: string,
  email: string,
  password: string,
  mode: 'login' | 'register'
): ValidationResult => {
  const missingRules: string[] = [];

  if (mode === 'register' && fullName.trim().length < 2) {
    missingRules.push('Lütfen adınızı ve soyadınızı girin (en az 2 karakter).');
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    missingRules.push('Lütfen geçerli bir e-posta adresi girin (ör. ad@alanadi.com).');
  }

  if (password.length < 6) {
    missingRules.push('Şifre en az 6 karakter uzunluğunda olmalıdır.');
  }

  if (mode === 'register') {
    if (!/[A-ZÇĞİÖŞÜ]/.test(password)) {
      missingRules.push('Şifre en az 1 büyük harf içermelidir.');
    }

    if (!/[a-zçğıöşü]/.test(password)) {
      missingRules.push('Şifre en az 1 küçük harf içermelidir.');
    }

    if (!/[0-9]/.test(password)) {
      missingRules.push('Şifre en az 1 rakam içermelidir.');
    }

    if (!/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü\s]/.test(password)) {
      missingRules.push('Şifre en az 1 özel karakter (sembol, örn: !@#$%.*) içermelidir.');
    }
  }

  return {
    isValid: missingRules.length === 0,
    missingRules
  };
};

export const AuthPage: React.FC = () => {
  const { login, register, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const validation = validateCredentials(fullName, email, password, activeTab);
  const hasStartedTyping = fullName.length > 0 || email.length > 0 || password.length > 0;
  const showValidationWarnings = !validation.isValid && (hasStartedTyping || submitAttempted);

  useEffect(() => {
    if (!isForgotModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isResetSubmitting) {
        setIsForgotModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isForgotModalOpen, isResetSubmitting]);

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setSubmitAttempted(false);
    setAuthError(null);
    setResetSuccessMessage(null);
  };

  const openForgotModal = () => {
    setResetEmail(email);
    setResetError(null);
    setIsForgotModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setAuthError(null);
    setResetSuccessMessage(null);

    if (!validation.isValid) {
      setSubmitAttempted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const result =
        activeTab === 'register'
          ? await register(email, password, fullName)
          : await login(email, password);

      if (!result.success) {
        setAuthError(result.error ?? 'İşlem sırasında bir hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResetSubmitting) return;
    setResetError(null);

    if (!EMAIL_REGEX.test(resetEmail.trim())) {
      setResetError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const result = await resetPassword(resetEmail);
      if (!result.success) {
        setResetError(result.error ?? 'Şifre sıfırlama bağlantısı gönderilemedi.');
        return;
      }

      setIsForgotModalOpen(false);
      setResetSuccessMessage(
        'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen spam kutunuzu da kontrol edin.'
      );
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      {/* Subtle Ambient Background Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-purple/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Centered Glassmorphism Auth Card */}
      <div className="w-full max-w-md relative z-10 rounded-3xl bg-white/90 dark:bg-[#0f172a]/75 backdrop-blur-xl border border-slate-200 dark:border-slate-800/90 p-7 sm:p-9 shadow-2xl shadow-slate-200/70 dark:shadow-black/60">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-purple/25 mb-3.5">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">YKS Koçum</h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-brand-purple/15 dark:bg-brand-purple/20 text-brand-purple dark:text-brand-purpleLight border border-brand-purple/30">
              Pro
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-purple dark:text-brand-purpleLight" />
            <span>Akıllı YKS Gelişim & Takip Platformu</span>
          </p>
        </div>

        {/* Tab Switcher: Giriş Yap / Kayıt Ol */}
        <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-1 mb-6">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white shadow-md shadow-brand-purple/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white shadow-md shadow-brand-purple/25'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Password Reset Success Banner */}
        {resetSuccessMessage && (
          <div className="mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3.5 flex items-start justify-between gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{resetSuccessMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setResetSuccessMessage(null)}
              className="text-emerald-600/70 hover:text-emerald-800 dark:text-emerald-400/70 dark:hover:text-emerald-200 transition shrink-0"
              aria-label="Bildirimi Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Auth Form (Full Name, Email & Password for Firebase Auth) */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name Input (only on Register tab) */}
          {activeTab === 'register' && (
            <div className="animate-fadeIn">
              <label
                htmlFor="auth-fullname"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Ad Soyad
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="Adınız Soyadınız"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setAuthError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 focus:shadow-[0_0_16px_rgba(139,92,246,0.22)] transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="ornek@eposta.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAuthError(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 focus:shadow-[0_0_16px_rgba(139,92,246,0.22)] transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                placeholder="Güçlü şifrenizi girin"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 focus:shadow-[0_0_16px_rgba(139,92,246,0.22)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition"
                aria-label={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Subtle Forgot Password Link (only on Login tab) */}
            {activeTab === 'login' && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs font-medium text-slate-600 hover:text-brand-purple dark:text-slate-400 dark:hover:text-brand-purpleLight transition"
                >
                  Şifremi Unuttum
                </button>
              </div>
            )}
          </div>

          {/* Validation Rules Warning Box */}
          {showValidationWarnings && (
            <div className="rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-500/10 dark:to-amber-500/10 border border-amber-300 dark:border-amber-500/30 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>Lütfen eksik kuralları tamamlayın:</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-[11px] text-rose-700 dark:text-rose-300/95">
                {validation.missingRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Firebase Auth Error Message */}
          {authError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{authError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-disabled={!validation.isValid || isSubmitting}
            className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-2 ${
              validation.isValid && !isSubmitting
                ? 'bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white shadow-lg shadow-brand-purple/25 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-200 text-slate-500 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/80 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {activeTab === 'login' ? 'Giriş Yapılıyor...' : 'Hesap Oluşturuluyor...'}
                </span>
              </>
            ) : activeTab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Giriş Yap</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Kayıt Ol</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          onClick={() => !isResetSubmitting && setIsForgotModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800/90 p-6 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 space-y-5 relative"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/15 border border-brand-purple/30 flex items-center justify-center text-brand-purple dark:text-brand-purpleLight shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Şifremi Unuttum
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sıfırlama bağlantısı gönder
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isResetSubmitting}
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Kayıtlı e-posta adresinizi girin, şifrenizi yenilemeniz için size bir sıfırlama bağlantısı gönderelim.
            </p>

            {/* Reset Password Form */}
            <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-email"
                    type="email"
                    autoFocus
                    placeholder="ornek@eposta.com"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      setResetError(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 transition-all"
                  />
                </div>
              </div>

              {resetError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{resetError}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isResetSubmitting}
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 disabled:opacity-60 text-white text-xs font-semibold shadow-md shadow-brand-purple/25 transition"
                >
                  {isResetSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Bağlantı Gönder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
