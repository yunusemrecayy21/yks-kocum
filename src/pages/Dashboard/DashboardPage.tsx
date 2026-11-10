import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  CheckSquare,
  BarChart3,
  TrendingUp,
  Flame,
  Clock,
  Timer,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Plus,
  Loader2,
  AlertTriangle,
  Quote,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  BookOpenCheck,
  Layers,
  Bot,
  SlidersHorizontal
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateKey } from '../../utils/date';
import { validatePasswordRequirements } from '../../utils/password';
import {
  fetchTasks,
  fetchExams,
  fetchMockExams,
  fetchStudyStats,
  EMPTY_STUDY_STATS
} from '../../services/firestoreService';
import type { StudyStatsRecord } from '../../services/firestoreService';
import type { MockExam, StudyTask, TrialExam } from '../../types';

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
  const { user, onboardingProfile, isTytOnly, changePassword } = useAuth();
  const userId = user?.uid;
  const displayUsername = user?.username || 'Öğrenci';
  const targetUniversity = onboardingProfile?.targetUniversity || 'Hedef Üniversite';
  const targetDepartment = onboardingProfile?.targetDepartment || 'Hedef Bölüm';
  const gradeLevel = onboardingProfile?.gradeLevel || '12. Sınıf';
  const studyField = onboardingProfile?.studyField || 'Sayısal';

  const [referenceDate] = useState<Date>(() => new Date());
  const dailyQuote = useMemo(() => getDailyQuote(referenceDate), [referenceDate]);

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [exams, setExams] = useState<TrialExam[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [studyStats, setStudyStats] = useState<StudyStatsRecord>(EMPTY_STUDY_STATS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick inline password update state inside Dashboard Security Bento Card
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load real data from Firebase Firestore on mount / user change
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setExams([]);
      setMockExams([]);
      setStudyStats(EMPTY_STUDY_STATS);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const [fetchedTasks, fetchedExams, fetchedMockExams, fetchedStats] = await Promise.all([
          fetchTasks(userId),
          fetchExams(userId),
          fetchMockExams(userId),
          fetchStudyStats(userId)
        ]);

        if (isMounted) {
          setTasks(fetchedTasks);
          setExams(fetchedExams);
          setMockExams(fetchedMockExams);
          setStudyStats(fetchedStats);
        }
      } catch (err) {
        console.error('Firestore dashboard fetch error:', err);
        if (isMounted) {
          setErrorMsg('Verileriniz Firestore veritabanından yüklenirken bir hata oluştu.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleQuickPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingPassword) return;
    setPasswordFeedback(null);

    const validationErrors = validatePasswordRequirements(newPassword);
    if (validationErrors.length > 0) {
      setPasswordFeedback({
        type: 'error',
        message: validationErrors[0]
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await changePassword(newPassword);
      if (!result.success) {
        setPasswordFeedback({
          type: 'error',
          message: result.error ?? 'Şifre güncellenemedi.'
        });
        return;
      }

      setNewPassword('');
      setPasswordFeedback({
        type: 'success',
        message: 'Şifren başarıyla güncellendi!'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Task metrics
  const visibleTasks = useMemo(
    () => (isTytOnly ? tasks.filter((t) => t.category !== 'AYT') : tasks),
    [tasks, isTytOnly]
  );
  const completedTasksCount = visibleTasks.filter((t) => t.completed).length;
  const taskCompletionPercent =
    visibleTasks.length > 0 ? Math.round((completedTasksCount / visibleTasks.length) * 100) : 0;

  // Exam metrics (combined mockExams + legacy exams)
  const tytExams = useMemo(() => {
    const combined = [
      ...mockExams
        .filter((e): e is MockExam & { tytNet: number } => e.tytNet !== null)
        .map((e) => ({ name: e.name, date: e.date, total: e.tytNet })),
      ...exams
        .filter((e) => e.examType === 'TYT')
        .map((e) => ({ name: e.name, date: e.date, total: e.scores.total }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [exams, mockExams]);

  const aytExams = useMemo(() => {
    const combined = [
      ...mockExams
        .filter(
          (e): e is MockExam & { aytNet: number } =>
            e.aytNet !== null && (!e.field || e.field === studyField)
        )
        .map((e) => ({ name: e.name, date: e.date, total: e.aytNet })),
      ...exams
        .filter((e) => e.examType === 'AYT' && (!e.field || e.field === studyField))
        .map((e) => ({ name: e.name, date: e.date, total: e.scores.total }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [exams, mockExams, studyField]);

  const latestTyt = tytExams[0] ?? null;
  const tytDiff =
    tytExams.length > 1
      ? parseFloat((tytExams[0].total - tytExams[1].total).toFixed(2))
      : null;

  const latestAyt = aytExams[0] ?? null;
  const aytDiff =
    aytExams.length > 1
      ? parseFloat((aytExams[0].total - aytExams[1].total).toFixed(2))
      : null;

  // Weekly study hours & active streak from real Firestore studyStats
  const { streakDays, weeklyHours, weeklyRemainingMins } = useMemo(() => {
    let totalWeeklyMins = 0;
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - offset);
      totalWeeklyMins += studyStats.dailyMinutes[getLocalDateKey(d)] ?? 0;
    }

    let streak = 0;
    const todayMins = studyStats.dailyMinutes[getLocalDateKey(referenceDate)] ?? 0;
    let checkOffset = todayMins > 0 ? 0 : 1;

    while (checkOffset < 365) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - checkOffset);
      const mins = studyStats.dailyMinutes[getLocalDateKey(d)] ?? 0;
      if (mins > 0) {
        streak++;
        checkOffset++;
      } else {
        break;
      }
    }

    return {
      streakDays: streak,
      weeklyHours: Math.floor(totalWeeklyMins / 60),
      weeklyRemainingMins: totalWeeklyMins % 60
    };
  }, [studyStats, referenceDate]);

  const tytTargetNet = 105;
  const aytTargetNet = 75;
  const tytProgressPercent = latestTyt
    ? Math.min(100, Math.round((latestTyt.total / tytTargetNet) * 100))
    : 0;
  const aytProgressPercent = latestAyt
    ? Math.min(100, Math.round((latestAyt.total / aytTargetNet) * 100))
    : 0;

  const getCoachInsight = () => {
    if (
      visibleTasks.length === 0 &&
      exams.length === 0 &&
      mockExams.length === 0 &&
      weeklyHours === 0 &&
      weeklyRemainingMins === 0
    ) {
      return `Kurulumun tamamlandı! İlk adım olarak Günlük Çalışma Programı'na bugünün hedeflerini ekleyebilir, Çalışma Sayacı ile odaklanabilir veya ilk deneme sonucunu kaydedebilirsin.`;
    }
    if (isTytOnly) {
      return `${gradeLevel} sürecinde düzenli TYT paragraf ve problem pratiği yapman, ileriki sınıflar için güçlü bir temel oluşturacaktır. Konu eksiklerini erken kapatmaya devam et!`;
    }
    if (studyField === 'Eşit Ağırlık') {
      return 'Eşit Ağırlık sıralamasında fark yaratmak için AYT Matematik netlerini korurken Edebiyat ve Sosyal-1 tekrarlarını haftalık periyotlara yayman çok önemli.';
    }
    if (studyField === 'Sözel') {
      return 'Edebiyat, Sosyal-1 ve Sosyal-2 branşlarında bilgi tutarlılığını artırmak için görsel özet kartlarıyla haftalık tekrarlar yapman netlerini hızla yukarı taşıyacaktır.';
    }
    if (studyField === 'Dil') {
      return 'YDT okuma hızını ve kelime dağarcığını geliştirirken TYT Türkçe ve Matematik netlerini yüksek tutmak seni hedeflediğin bölüme bir adım daha yaklaştıracaktır.';
    }
    return 'Düzenli deneme analizi yaparak yanlış çıkan konularını Günlük Çalışma Programı listene eklemen netlerini istikrarlı şekilde yukarı taşıyacaktır.';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Premium Welcome Header & Motivation Quote Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/70 to-purple-50 dark:from-slate-800 dark:via-slate-800/95 dark:to-indigo-950/90 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/40 transition-colors duration-300">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-purple/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Greeting Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
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

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/program"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-purple/25 hover:scale-[1.02] transition-all duration-200"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Bugünkü Program</span>
              </Link>
              <Link
                to="/denemeler"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-700 dark:text-slate-100 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:scale-[1.02] transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
                <span>Deneme Netleri</span>
              </Link>
              <Link
                to="/sayac"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-700 dark:text-slate-100 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:scale-[1.02] transition-all duration-200"
              >
                <Timer className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <span>Çalışma Sayacı</span>
              </Link>
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

      {/* Firestore Error Alert */}
      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* BENTO GRID SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5">
        {/* BENTO CARD 1: Gradient Highlighted Hedef Üniversite & Bölüm */}
        <div className="md:col-span-6 lg:col-span-7 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/90 to-sky-50 dark:from-brand-purple/25 dark:via-slate-800 dark:to-indigo-950/90 border border-purple-200/80 dark:border-brand-purple/40 p-6 shadow-lg shadow-purple-500/5 dark:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/70 border border-purple-200 dark:border-brand-purple/40 text-[11px] font-semibold text-brand-purple dark:text-brand-purpleLight">
                <Target className="w-3.5 h-3.5" />
                <span>Hedef Üniversite &amp; Bölüm</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {targetUniversity}
              </h2>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>{targetDepartment}</span>
              </p>
            </div>

            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/90 hover:bg-white text-slate-700 hover:text-brand-purple dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:text-slate-200 dark:hover:text-white border border-purple-200/80 dark:border-slate-700 transition self-start shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Hedefi Güncelle</span>
            </Link>
          </div>

          {/* Net Target Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-purple-200/70 dark:border-slate-700/80">
            <div className="p-3.5 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-purple-100 dark:border-slate-700/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">TYT Net Hedefi</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {latestTyt ? latestTyt.total.toFixed(2) : '0.00'} / {tytTargetNet}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${tytProgressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tamamlanma: <span className="font-semibold text-sky-600 dark:text-sky-400">%{tytProgressPercent}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-purple-100 dark:border-slate-700/70 space-y-2">
              {!isTytOnly ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      AYT ({studyField})
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {latestAyt ? latestAyt.total.toFixed(2) : '0.00'} / {aytTargetNet}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-purple to-purple-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${aytProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tamamlanma: <span className="font-semibold text-brand-purple dark:text-brand-purpleLight">%{aytProgressPercent}</span>
                  </p>
                </>
              ) : (
                <div className="h-full flex flex-col justify-center">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Aktif Mod</span>
                  <span className="text-sm font-bold text-brand-purple dark:text-brand-purpleLight mt-0.5">
                    TYT Temel Güçlendirme
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {gradeLevel} seviyesine özel plan
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: Aesthetic Password Change / Account Security Card */}
        <div className="md:col-span-6 lg:col-span-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg shadow-slate-200/50 dark:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Hesap &amp; Şifre Değiştirme
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'E-posta tanımlı'}
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="text-xs font-semibold text-brand-purple dark:text-brand-purpleLight hover:underline shrink-0"
            >
              Profilim
            </Link>
          </div>

          <form onSubmit={handleQuickPasswordUpdate} className="space-y-3 pt-4">
            <div>
              <label
                htmlFor="dashboard-new-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Hızlı Şifre Güncelleme
              </label>
              <div className="relative">
                <input
                  id="dashboard-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordFeedback(null);
                  }}
                  placeholder="Yeni güçlü şifreni yaz..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-purple transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  aria-label={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordFeedback && (
              <div
                className={`rounded-xl p-2.5 flex items-center gap-2 text-xs ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-purple dark:hover:bg-brand-purpleHover disabled:opacity-50 text-white text-xs font-semibold transition"
            >
              {isUpdatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isUpdatingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span>
            </button>
          </form>
        </div>

        {/* BENTO ROW 2: 4 Sleek Quick Metric & Weekly Summary Cards */}
        {/* Metric 1: Latest TYT Net */}
        <div className="md:col-span-3 lg:col-span-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-md shadow-slate-200/50 dark:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Son TYT Neti
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {isLoading ? '...' : latestTyt ? latestTyt.total.toFixed(2) : '0.00'}
              </span>
              {!isLoading && tytDiff !== null && (
                <span
                  className={`text-xs font-semibold ${
                    tytDiff >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {tytDiff >= 0 ? `+${tytDiff}` : tytDiff} net
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
              {isLoading ? 'Yükleniyor...' : latestTyt ? latestTyt.name : 'İlk denemeni ekle'}
            </p>
          </div>
        </div>

        {/* Metric 2: Real Study Streak & Weekly Focus */}
        <div className="md:col-span-3 lg:col-span-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-md shadow-slate-200/50 dark:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Çalışma Serisi
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {isLoading ? '...' : `${streakDays} Gün`}
              </span>
              {!isLoading && (
                <Badge variant={streakDays > 0 ? 'amber' : 'slate'}>
                  {streakDays > 0 ? 'Aralıksız' : 'Hazır'}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {isLoading
                ? 'Yükleniyor...'
                : `Haftalık odak: ${weeklyHours} saat ${weeklyRemainingMins} dk`}
            </p>
          </div>
        </div>

        {/* Metric 3: New Static Enrichment Metric — Çözülen Soru */}
        <div className="md:col-span-3 lg:col-span-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-md shadow-slate-200/50 dark:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Çözülen Soru
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <BookOpenCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                480 Soru
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                %80
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-4/5" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Haftalık Özet · Hedef 600 soru
            </p>
          </div>
        </div>

        {/* Metric 4: New Static Enrichment Metric — Kalan Konu */}
        <div className="md:col-span-3 lg:col-span-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-md shadow-slate-200/50 dark:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Kalan Konu
            </span>
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple dark:text-brand-purpleLight border border-brand-purple/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                14 Konu
              </span>
              <span className="text-[11px] font-semibold text-brand-purple dark:text-brand-purpleLight">
                %74 Bitti
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-purple h-full rounded-full w-3/4" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Hızlı İstatistik · {isTytOnly ? 'TYT Müfredatı' : 'TYT + AYT Planı'}
            </p>
          </div>
        </div>

        {/* BENTO ROW 3: Bugünün Çalışma Listesi (8 cols) + Haftalık Özet & Koçluk Kartı (4 cols) */}
        <div className="md:col-span-6 lg:col-span-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg shadow-slate-200/50 dark:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Bugünün Çalışma Listesi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Günlük ilerleme: %{taskCompletionPercent} ({completedTasksCount}/{visibleTasks.length} görev)
                </p>
              </div>
            </div>
            <Link
              to="/program"
              className="text-xs font-semibold text-brand-purple hover:text-brand-purpleHover dark:text-brand-purpleLight dark:hover:text-white inline-flex items-center gap-1 transition"
            >
              <span>Tümünü Gör</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-7 h-7 text-brand-purple dark:text-brand-purpleLight animate-spin mb-2.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Verileriniz Firestore&apos;dan yükleniyor...
              </p>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40">
              <CheckSquare className="w-9 h-9 text-slate-400 dark:text-slate-500 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Henüz bir görev eklemedin. Bugünün ilk çalışma hedefini ekleyerek başla!
              </p>
              <Link
                to="/program"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Görev Ekle</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
              {visibleTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/70 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                        task.completed
                          ? 'bg-brand-purple border-brand-purple text-white'
                          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                      }`}
                    >
                      {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.completed
                            ? 'text-slate-400 line-through'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {task.topic}
                      </p>
                      <span className="text-xs text-brand-purple dark:text-brand-purpleLight">
                        {task.subject} ({task.category})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.durationMinutes ?? 30} dk
                    </span>
                    <Badge variant={task.completed ? 'emerald' : 'slate'}>
                      {task.completed ? 'Bitti' : 'Kaldı'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Summary & AI Coach Quick Card */}
        <div className="md:col-span-6 lg:col-span-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 shadow-lg shadow-slate-200/50 dark:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Haftalık Koç Özeti
                </h2>
              </div>
              <Badge variant="purple">{studyField}</Badge>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-purple dark:text-brand-purpleLight">
                <Target className="w-3.5 h-3.5" />
                <span>Koçun Strateji Notu</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {getCoachInsight()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Son AYT Neti
                </span>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {isTytOnly ? 'TYT Odaklı' : latestAyt ? `${latestAyt.total.toFixed(2)} Net` : '0.00 Net'}
                  </span>
                  {!isTytOnly && aytDiff !== null && (
                    <span
                      className={`text-[11px] font-semibold ${
                        aytDiff >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      ({aytDiff >= 0 ? `+${aytDiff}` : aytDiff})
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Haftalık Odak
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {weeklyHours}s {weeklyRemainingMins}dk
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/koc"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-purple/20 transition"
          >
            <Bot className="w-4 h-4" />
            <span>Yapay Zeka Koçuna Danış</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
