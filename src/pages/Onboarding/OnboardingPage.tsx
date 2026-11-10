import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Target,
  Building2,
  BookOpen,
  Compass,
  ArrowRight,
  AlertTriangle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { GradeLevel, StudyField } from '../../types';

const GRADE_OPTIONS: GradeLevel[] = [
  '9. Sınıf',
  '10. Sınıf',
  '11. Sınıf',
  '12. Sınıf',
  'Mezun'
];

const FIELD_OPTIONS: StudyField[] = [
  'Sayısal',
  'Eşit Ağırlık',
  'Sözel',
  'Dil',
  'Sadece TYT'
];

export const OnboardingPage: React.FC = () => {
  const { user, onboardingProfile, saveOnboardingProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1' && Boolean(onboardingProfile);

  const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(
    onboardingProfile?.gradeLevel ?? null
  );
  const [studyField, setStudyField] = useState<StudyField | null>(
    onboardingProfile?.studyField ?? null
  );
  const [targetUniversity, setTargetUniversity] = useState<string>(
    onboardingProfile?.targetUniversity ?? ''
  );
  const [targetDepartment, setTargetDepartment] = useState<string>(
    onboardingProfile?.targetDepartment ?? ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isSelectedTytOnly =
    gradeLevel === '9. Sınıf' ||
    gradeLevel === '10. Sınıf' ||
    studyField === 'Sadece TYT';

  const isFormComplete =
    Boolean(gradeLevel) &&
    Boolean(studyField) &&
    targetUniversity.trim().length > 0 &&
    targetDepartment.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!gradeLevel || !studyField || !targetUniversity.trim() || !targetDepartment.trim()) {
      setErrorMsg('Lütfen devam etmeden önce tüm soruları yanıtlayın ve hedef bilgilerinizi girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveOnboardingProfile({
        gradeLevel,
        studyField,
        targetUniversity: targetUniversity.trim(),
        targetDepartment: targetDepartment.trim()
      });

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Firestore profile save error:', err);
      setErrorMsg('Profil bilgileri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      {/* Ambient Background Glow */}
      <div className="absolute -top-36 -left-36 w-96 h-96 rounded-full bg-brand-purple/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Centered Glassmorphism Card */}
      <div className="w-full max-w-2xl relative z-10 rounded-3xl bg-white/90 dark:bg-[#0f172a]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/90 p-6 sm:p-9 shadow-2xl shadow-slate-200/70 dark:shadow-black/60">
        {isEditMode && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Panele Geri Dön</span>
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-purple/25 mb-3.5">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/10 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight text-[11px] font-semibold border border-brand-purple/30 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Kişisel Koçluk Kurulumu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditMode
              ? 'Hedeflerini Güncelle'
              : `Hoş Geldin, ${user?.displayName?.trim() || 'Öğrenci'}!`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-lg">
            Sana en uygun çalışma ekranını ve deneme analizlerini hazırlayabilmemiz için bu 4 kısa soruyu yanıtla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Sınıf Durumun */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
              <span className="w-5 h-5 rounded-full bg-brand-purple/15 dark:bg-brand-purple/20 text-brand-purple dark:text-brand-purpleLight border border-brand-purple/40 flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <GraduationCap className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
              <span>Sınıf Durumun</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {GRADE_OPTIONS.map((grade) => {
                const selected = gradeLevel === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => {
                      setGradeLevel(grade);
                      setErrorMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                      selected
                        ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white border-brand-purple shadow-md shadow-brand-purple/25'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-950/70 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white dark:hover:border-slate-700'
                    }`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Alan/Bölüm Tercihin */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
              <span className="w-5 h-5 rounded-full bg-brand-purple/15 dark:bg-brand-purple/20 text-brand-purple dark:text-brand-purpleLight border border-brand-purple/40 flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <Compass className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
              <span>Alan / Bölüm Tercihin</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {FIELD_OPTIONS.map((field) => {
                const selected = studyField === field;
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => {
                      setStudyField(field);
                      setErrorMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                      selected
                        ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white border-brand-purple shadow-md shadow-brand-purple/25'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-950/70 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white dark:hover:border-slate-700'
                    }`}
                  >
                    {field}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Mode Preview Hint */}
          {gradeLevel && studyField && (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Aktif Olacak Sistem Modu:</span>
              <span className="font-semibold text-brand-purple dark:text-brand-purpleLight">
                {isSelectedTytOnly
                  ? 'Sadece TYT Odaklı Takip Modu'
                  : `TYT + AYT (${studyField}) Takip Modu`}
              </span>
            </div>
          )}

          {/* 3 & 4. Hedef Üniversite & Hedef Bölüm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="target-university"
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white"
              >
                <span className="w-5 h-5 rounded-full bg-brand-purple/15 dark:bg-brand-purple/20 text-brand-purple dark:text-brand-purpleLight border border-brand-purple/40 flex items-center justify-center text-[11px] font-bold">
                  3
                </span>
                <Building2 className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
                <span>Hedef Üniversite</span>
              </label>
              <input
                id="target-university"
                type="text"
                placeholder="Örn: Boğaziçi Üniversitesi"
                value={targetUniversity}
                onChange={(e) => {
                  setTargetUniversity(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 focus:shadow-[0_0_16px_rgba(139,92,246,0.22)] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="target-department"
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white"
              >
                <span className="w-5 h-5 rounded-full bg-brand-purple/15 dark:bg-brand-purple/20 text-brand-purple dark:text-brand-purpleLight border border-brand-purple/40 flex items-center justify-center text-[11px] font-bold">
                  4
                </span>
                <BookOpen className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
                <span>Hedef Bölüm</span>
              </label>
              <input
                id="target-department"
                type="text"
                placeholder="Örn: Bilgisayar Mühendisliği"
                value={targetDepartment}
                onChange={(e) => {
                  setTargetDepartment(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 focus:shadow-[0_0_16px_rgba(139,92,246,0.22)] transition-all"
              />
            </div>
          </div>

          {/* Validation Error Alert */}
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-amber-500/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isFormComplete && !isSubmitting
                ? 'bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white shadow-lg shadow-brand-purple/25 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-200 text-slate-500 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/80 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <span>{isEditMode ? 'Değişiklikleri Kaydet' : 'Kurulumu Tamamla ve Başla'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
