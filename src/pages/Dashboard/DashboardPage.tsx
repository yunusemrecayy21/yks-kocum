import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Sparkles,
  GraduationCap,
  Quote,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MOTIVATION_QUOTES = [
  {
    text: 'Başarı, her gün tekrar edilen küçük ve kararlı çabaların toplamıdır.',
    author: 'Robert Collier'
  },
  {
    text: 'Yorulmadığın gün değil, pes etmediğin gün hedefe bir adım daha yaklaşırsın.',
    author: 'YKS Koçluk Notu'
  },
  {
    text: 'Büyük hayaller, bugünün disiplinli bir saatlik çalışmasıyla inşa edilir.',
    author: 'YKS Koçluk Notu'
  },
  {
    text: 'Yanlış yaptığın her soru, sınav günü kurtardığın bir nettir.',
    author: 'Koçluk Stratejisi'
  }
];

const getDailyQuote = (date: Date) => {
  const daySeed = date.getFullYear() * 366 + date.getMonth() * 31 + date.getDate();
  return MOTIVATION_QUOTES[daySeed % MOTIVATION_QUOTES.length];
};

export const DashboardPage: React.FC = () => {
  const { user, onboardingProfile, isTytOnly } = useAuth();
  const displayUsername = user?.username || 'Öğrenci';
  const targetUniversity = onboardingProfile?.targetUniversity || 'Hedef Üniversite';
  const targetDepartment = onboardingProfile?.targetDepartment || 'Hedef Bölüm';
  const gradeLevel = onboardingProfile?.gradeLevel || '12. Sınıf';
  const studyField = onboardingProfile?.studyField || 'Sayısal';

  const [referenceDate] = useState<Date>(() => new Date());
  const dailyQuote = useMemo(() => getDailyQuote(referenceDate), [referenceDate]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Minimalist Welcome Banner + Motivation Quote + Side Target Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/70 to-purple-50 dark:from-slate-800 dark:via-slate-800/95 dark:to-indigo-950/90 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/40 transition-colors duration-300">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-purple/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Left Welcome Text + Right Target University & Department Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Greeting Text */}
            <div className="space-y-2.5 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple dark:text-brand-purpleLight text-xs font-semibold border border-brand-purple/25">
                <Sparkles className="w-3.5 h-3.5" />
                <span>YKS Koçum · {gradeLevel} ({studyField})</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Tekrar hoş geldin,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-indigo-500 dark:from-brand-purpleLight dark:to-sky-400">
                  {displayUsername}!
                </span>{' '}
                YKS yolculuğunda bugün nasılsın?
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Bugünkü planını tamamla, odak seanslarıyla ritmini koru ve {isTytOnly ? 'TYT' : 'TYT/AYT'} deneme netlerini düzenli takip et.
              </p>
            </div>

            {/* Right: Sleek Minimalist Target University & Department Card */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/95 to-sky-50 dark:from-brand-purple/25 dark:via-slate-800/95 dark:to-indigo-950/90 border border-purple-200/80 dark:border-brand-purple/40 p-5 shadow-md shadow-purple-500/10 dark:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 dark:bg-slate-900/75 border border-purple-200 dark:border-brand-purple/40 text-[11px] font-semibold text-brand-purple dark:text-brand-purpleLight">
                  <Target className="w-3.5 h-3.5" />
                  <span>Hedef Üniversite &amp; Bölüm</span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {targetUniversity}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>{targetDepartment}</span>
                </p>
              </div>

              <div className="pt-1">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/90 hover:bg-white text-slate-700 hover:text-brand-purple dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:text-slate-200 dark:hover:text-white border border-purple-200/80 dark:border-slate-700 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Hedefi Güncelle</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Günün Motivasyon Sözü Strip */}
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/65 backdrop-blur-md border border-purple-200/70 dark:border-slate-700/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-purple/20 shrink-0">
                <Quote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-purple dark:text-brand-purpleLight block">
                  Günün Motivasyon Sözü
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 italic mt-0.5">
                  &ldquo;{dailyQuote.text}&rdquo;
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 self-end sm:self-center">
              — {dailyQuote.author}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
