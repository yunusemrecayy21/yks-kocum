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
  AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateKey } from '../../utils/date';
import {
  fetchTasks,
  fetchExams,
  fetchMockExams,
  fetchStudyStats,
  EMPTY_STUDY_STATS
} from '../../services/firestoreService';
import type { StudyStatsRecord } from '../../services/firestoreService';
import type { MockExam, StudyTask, TrialExam } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user, onboardingProfile, isTytOnly } = useAuth();
  const userId = user?.uid;
  const displayUsername = user?.username || 'Öğrenci';
  const targetUniversity = onboardingProfile?.targetUniversity || 'Hedef Üniversite';
  const targetDepartment = onboardingProfile?.targetDepartment || 'Hedef Bölüm';
  const gradeLevel = onboardingProfile?.gradeLevel || '12. Sınıf';
  const studyField = onboardingProfile?.studyField || 'Sayısal';

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [exams, setExams] = useState<TrialExam[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [studyStats, setStudyStats] = useState<StudyStatsRecord>(EMPTY_STUDY_STATS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      const d = new Date();
      d.setDate(d.getDate() - offset);
      totalWeeklyMins += studyStats.dailyMinutes[getLocalDateKey(d)] ?? 0;
    }

    let streak = 0;
    const todayMins = studyStats.dailyMinutes[getLocalDateKey(new Date())] ?? 0;
    let checkOffset = todayMins > 0 ? 0 : 1;

    while (checkOffset < 365) {
      const d = new Date();
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
  }, [studyStats]);

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
    <div className="space-y-8 animate-fadeIn">
      {/* Motivasyon Köşesi & Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-100 dark:from-[#141b2e] dark:via-[#1a1c3d] dark:to-[#12182b] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-purple/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-5">
          {/* Top Motivation Corner */}
          <div className="pb-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight text-xs font-semibold border border-brand-purple/25 dark:border-brand-purple/30">
                <Target className="w-3.5 h-3.5" />
                <span>Motivasyon Köşesi · {gradeLevel} ({studyField})</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-brand-purple dark:from-white dark:via-slate-100 dark:to-brand-purpleLight">
                Hedef: {targetUniversity} - {targetDepartment}
              </h1>
            </div>

            <Link
              to="/onboarding?edit=1"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-purple dark:text-slate-400 dark:hover:text-brand-purpleLight bg-white/80 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl transition self-start lg:self-auto shrink-0"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Hedefi Düzenle</span>
            </Link>
          </div>

          {/* Welcome Subtitle & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
                <span>Hoş Geldin, {displayUsername}! 👋</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Bugün hedefine ulaşmak için harika bir gün. Günlük çalışma programındaki konuları tamamla ve {isTytOnly ? 'TYT' : 'TYT/AYT'} deneme netlerini düzenli kaydederek gelişimini izle.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/program"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white text-sm font-semibold shadow-lg shadow-brand-purple/25 transition-all duration-200"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Bugünkü Programa Git</span>
              </Link>
              <Link
                to="/denemeler"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Net Girişi</span>
              </Link>
              <Link
                to="/sayac"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-200 dark:hover:text-white text-sm font-semibold border border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 transition-all duration-200"
              >
                <Timer className="w-4 h-4" />
                <span>Çalışma Sayacı</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Firestore Error Alert */}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary KPI Metrics (100% real data from Firebase Firestore) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isTytOnly ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        {/* Metric 1: Daily Progress */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Günlük İlerleme</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-brand-purple dark:text-brand-purpleLight border border-purple-500/20">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : `${completedTasksCount} / ${visibleTasks.length}`}
              </span>
              <span className="text-xs font-semibold text-brand-purple dark:text-brand-purpleLight">
                {isLoading ? '' : `%${taskCompletionPercent}`}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-purple h-full rounded-full transition-all duration-300"
                style={{ width: `${isLoading ? 0 : taskCompletionPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {isLoading
                ? 'Yükleniyor...'
                : visibleTasks.length === 0
                ? 'Henüz görev eklenmedi'
                : 'Tamamlanan görevler'}
            </p>
          </div>
        </Card>

        {/* Metric 2: Latest TYT Net */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Son TYT Neti</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : latestTyt ? latestTyt.total.toFixed(2) : '0.00'}
              </span>
              {!isLoading && tytDiff !== null && (
                <span
                  className={`text-xs font-medium flex items-center ${
                    tytDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {tytDiff >= 0 ? `+${tytDiff}` : tytDiff} net
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Hedef: {tytTargetNet.toFixed(2)}</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[120px]">
                {isLoading ? 'Yükleniyor...' : latestTyt ? latestTyt.name : 'Veri yok'}
              </span>
            </div>
          </div>
        </Card>

        {/* Metric 3: Latest AYT Net (Only shown if NOT TYT-only) */}
        {!isTytOnly && (
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Son AYT Neti</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : latestAyt ? latestAyt.total.toFixed(2) : '0.00'}
                </span>
                {!isLoading && aytDiff !== null && (
                  <span
                    className={`text-xs font-medium flex items-center ${
                      aytDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {aytDiff >= 0 ? `+${aytDiff}` : aytDiff} net
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Hedef: {aytTargetNet.toFixed(2)}</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[120px]">
                  {isLoading
                    ? 'Yükleniyor...'
                    : latestAyt
                    ? latestAyt.name
                    : `${studyField} · Veri yok`}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Metric 4: Real Study Streak & Weekly Total */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Çalışma Serisi</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : `${streakDays} Gün`}
              </span>
              {!isLoading && (
                <Badge variant={streakDays > 0 ? 'amber' : 'slate'}>
                  {streakDays > 0 ? 'Aralıksız' : 'Hazır'}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isLoading
                ? 'Yükleniyor...'
                : `Bu hafta toplam: ${weeklyHours} saat ${weeklyRemainingMins} dk`}
            </p>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Daily tasks preview & Coaching card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Tasks Snapshot */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-purple" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Bugünün Çalışma Listesi</h2>
            </div>
            <Link
              to="/program"
              className="text-xs font-medium text-brand-purple hover:text-brand-purpleHover dark:text-brand-purpleLight dark:hover:text-white flex items-center gap-1 transition"
            >
              <span>Tümünü Gör</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <Card className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-7 h-7 text-brand-purple dark:text-brand-purpleLight animate-spin mb-3" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Verileriniz Firestore'dan yükleniyor...
              </p>
            </Card>
          ) : visibleTasks.length === 0 ? (
            <Card className="text-center py-10 px-6 border-dashed border-slate-300 dark:border-slate-800">
              <CheckSquare className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Henüz bir görev eklemedin. Yeni bir görev ekleyerek çalışmaya başla!
              </p>
              <Link
                to="/program"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-purple/10 dark:bg-brand-purple/20 hover:bg-brand-purple text-brand-purple dark:text-brand-purpleLight hover:text-white border border-brand-purple/30 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Görev Ekle</span>
              </Link>
            </Card>
          ) : (
            <Card className="p-0 divide-y divide-slate-200 dark:divide-slate-800/80 overflow-hidden">
              {visibleTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        task.completed
                          ? 'bg-brand-purple border-brand-purple text-white'
                          : 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50'
                      }`}
                    >
                      {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {task.topic}
                      </p>
                      <span className="text-xs text-brand-purple dark:text-brand-purpleLight/80">
                        {task.subject} ({task.category})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.durationMinutes ?? 30} dk
                    </span>
                    <Badge variant={task.completed ? 'emerald' : 'slate'}>
                      {task.completed ? 'Bitti' : 'Kaldı'}
                    </Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Right 1 Col: Quick Coaching & Target Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hedef & Koçluk Durumu</h2>
          </div>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Program Modu</span>
              <span className="text-sm font-bold text-brand-purple dark:text-brand-purpleLight">
                {gradeLevel} · {studyField}
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">TYT Net Hedefi</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {latestTyt ? latestTyt.total.toFixed(2) : '0.00'} / {tytTargetNet.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${tytProgressPercent}%` }}
                  />
                </div>
              </div>

              {!isTytOnly && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">AYT ({studyField}) Net Hedefi</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {latestAyt ? latestAyt.total.toFixed(2) : '0.00'} / {aytTargetNet.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-purple to-purple-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${aytProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Coach Insight */}
            <div className="pt-2">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple dark:text-brand-purpleLight">
                  <Target className="w-3.5 h-3.5" />
                  <span>Koçun Haftalık Analizi</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {getCoachInsight()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
