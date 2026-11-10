import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Headphones,
  Flame,
  Coffee,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  BookOpen,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
  Award,
  Maximize2
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFullscreenTimer } from '../hooks/useFullscreenTimer';
import { FullscreenFocusView } from '../components/timer/FullscreenFocusView';
import { getLocalDateKey } from '../utils/date';
import { playTimerChime } from '../utils/audio';
import {
  fetchStudySessions,
  addStudySessionToFirestore
} from '../services/firestoreService';
import type { StudySession } from '../types';

type PomodoroMode = 'focus' | 'break';

const formatCountdown = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatSessionTime = (isoString: string): string => {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(isoString));
  } catch {
    return '';
  }
};

export const StudyRoom: React.FC = () => {
  const { user, onboardingProfile } = useAuth();
  const { isDark } = useTheme();
  const {
    containerRef,
    isFullscreen,
    controlsVisible,
    enterFullscreen,
    exitFullscreen,
    handleActivity,
    keepControlsVisible
  } = useFullscreenTimer();
  const userId = user?.uid;

  // Pomodoro durations (default: 25 dk Odak / 5 dk Mola)
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [showCustomControls, setShowCustomControls] = useState<boolean>(false);
  const [customFocusInput, setCustomFocusInput] = useState<string>('25');
  const [customBreakInput, setCustomBreakInput] = useState<string>('5');

  // Timer state
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [focusTopic, setFocusTopic] = useState<string>('');

  // Firestore studySessions state
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completionBanner, setCompletionBanner] = useState<{
    type: PomodoroMode;
    title: string;
    message: string;
  } | null>(null);

  // Refs for accurate background timing & duplicate-completion prevention
  const targetTimestampRef = useRef<number | null>(null);
  const completingLockRef = useRef<boolean>(false);
  const originalTitleRef = useRef<string>(
    typeof document !== 'undefined' ? document.title : 'YKS Koçum'
  );

  // Fetch user's Firestore studySessions on mount / user change
  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setIsLoadingSessions(false);
      return;
    }

    let isMounted = true;

    const loadSessions = async () => {
      setIsLoadingSessions(true);
      setErrorMsg(null);
      try {
        const fetched = await fetchStudySessions(userId);
        if (isMounted) {
          setSessions(fetched);
        }
      } catch (err) {
        console.error('Firestore studySessions fetch error:', err);
        if (isMounted) {
          setErrorMsg('Pomodoro seans geçmişi Firestore üzerinden yüklenemedi.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false);
        }
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Keep document title updated while timer runs in live study room
  useEffect(() => {
    if (isRunning) {
      const tag = mode === 'focus' ? 'Odak' : 'Mola';
      document.title = `${formatCountdown(remainingSeconds)} (${tag}) · Canlı Çalışma Odası`;
    } else {
      document.title = originalTitleRef.current;
    }

    return () => {
      document.title = originalTitleRef.current;
    };
  }, [isRunning, remainingSeconds, mode]);

  const persistCompletedFocusSession = useCallback(async () => {
    if (!userId) return;
    setIsSavingSession(true);
    setErrorMsg(null);

    try {
      const created = await addStudySessionToFirestore(userId, {
        date: getLocalDateKey(),
        minutes: focusDuration,
        focusTopic
      });
      setSessions((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Firestore studySessions save error:', err);
      setErrorMsg(
        'Odak seansı tamamlandı ancak Firestore studySessions koleksiyonuna kaydedilemedi.'
      );
    } finally {
      setIsSavingSession(false);
    }
  }, [userId, focusDuration, focusTopic]);

  const handleTimerComplete = useCallback(
    (completedMode: PomodoroMode) => {
      playTimerChime(soundEnabled);

      if (completedMode === 'focus') {
        void persistCompletedFocusSession();
        setCompletionBanner({
          type: 'focus',
          title: 'Pomodoro Odak Seansı Tamamlandı!',
          message: `${focusDuration} dakikalık odak seansın studySessions kaydına eklendi. Şimdi ${breakDuration} dakikalık kısa molanın tadını çıkarabilirsin.`
        });
        setMode('break');
        setRemainingSeconds(breakDuration * 60);
      } else {
        setCompletionBanner({
          type: 'break',
          title: 'Mola Süresi Sona Erdi!',
          message: `Zihnini dinlendirdin. Yeni bir ${focusDuration} dakikalık odak seansına başlamaya hazırsın.`
        });
        setMode('focus');
        setRemainingSeconds(focusDuration * 60);
      }
    },
    [soundEnabled, persistCompletedFocusSession, focusDuration, breakDuration]
  );

  // Background-safe countdown interval driven by wall-clock target timestamp
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (targetTimestampRef.current === null) return;

      const diffMs = targetTimestampRef.current - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(nextSeconds);

      if (nextSeconds <= 0 && !completingLockRef.current) {
        completingLockRef.current = true;
        targetTimestampRef.current = null;
        setIsRunning(false);
        handleTimerComplete(mode);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, mode, handleTimerComplete]);

  const handleStart = () => {
    if (isRunning) return;
    completingLockRef.current = false;
    setCompletionBanner(null);

    const activeSeconds =
      remainingSeconds > 0
        ? remainingSeconds
        : (mode === 'focus' ? focusDuration : breakDuration) * 60;

    if (remainingSeconds <= 0) {
      setRemainingSeconds(activeSeconds);
    }

    targetTimestampRef.current = Date.now() + activeSeconds * 1000;
    setIsRunning(true);
  };

  const handlePause = () => {
    if (!isRunning) return;
    if (targetTimestampRef.current !== null) {
      const remaining = Math.max(
        0,
        Math.ceil((targetTimestampRef.current - Date.now()) / 1000)
      );
      setRemainingSeconds(remaining);
    }
    targetTimestampRef.current = null;
    setIsRunning(false);
  };

  const handleReset = () => {
    targetTimestampRef.current = null;
    completingLockRef.current = false;
    setIsRunning(false);
    setCompletionBanner(null);
    setRemainingSeconds((mode === 'focus' ? focusDuration : breakDuration) * 60);
  };

  const switchMode = (nextMode: PomodoroMode) => {
    if (mode === nextMode) return;
    targetTimestampRef.current = null;
    completingLockRef.current = false;
    setIsRunning(false);
    setMode(nextMode);
    setRemainingSeconds((nextMode === 'focus' ? focusDuration : breakDuration) * 60);
  };

  const applyDurations = (nextFocus: number, nextBreak: number) => {
    targetTimestampRef.current = null;
    completingLockRef.current = false;
    setIsRunning(false);
    setFocusDuration(nextFocus);
    setBreakDuration(nextBreak);
    setCustomFocusInput(String(nextFocus));
    setCustomBreakInput(String(nextBreak));
    setRemainingSeconds((mode === 'focus' ? nextFocus : nextBreak) * 60);
  };

  const handleCustomDurationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFocus = Math.min(180, Math.max(1, parseInt(customFocusInput, 10) || 25));
    const parsedBreak = Math.min(60, Math.max(1, parseInt(customBreakInput, 10) || 5));
    applyDurations(parsedFocus, parsedBreak);
    setShowCustomControls(false);
  };

  // Derived today & overall session stats
  const todayKey = getLocalDateKey();
  const todayStats = useMemo(() => {
    const todayItems = sessions.filter((s) => s.date === todayKey);
    const todayMinutes = todayItems.reduce((sum, s) => sum + s.minutes, 0);
    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
    return {
      todayCount: todayItems.length,
      todayMinutes,
      totalCount: sessions.length,
      totalMinutes
    };
  }, [sessions, todayKey]);

  // SVG progress circle math
  const totalModeSeconds = (mode === 'focus' ? focusDuration : breakDuration) * 60;
  const progressRatio = totalModeSeconds > 0 ? remainingSeconds / totalModeSeconds : 0;
  const radius = 126;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const trackStroke = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Headphones className="w-7 h-7 text-brand-purple" />
              Canlı Çalışma Odası (Pomodoro)
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
              <span
                className={`w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ${
                  isRunning ? 'animate-ping' : 'animate-pulse'
                }`}
              />
              {isRunning ? 'Odak Akışı Aktif' : 'Oda Hazır'}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Dikkat dağıtıcıları kapat, 25 dakikalık Pomodoro turlarıyla derin odaklan ve her seansı hesabına kaydet.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onboardingProfile?.targetUniversity && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-brand-purple/10 border border-purple-200 dark:border-brand-purple/25 text-xs font-medium text-brand-purple dark:text-brand-purpleLight">
              <Award className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px]">{onboardingProfile.targetUniversity}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void enterFullscreen()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white shadow-md shadow-brand-purple/20 transition"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Tam Ekran (Focus Mode)</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              soundEnabled
                ? 'bg-purple-50 dark:bg-slate-900 text-brand-purple dark:text-brand-purpleLight border-purple-200 dark:border-brand-purple/30'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
            title={soundEnabled ? 'Bitiş Zili Açık' : 'Bitiş Zili Kapalı'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span>{soundEnabled ? 'Zil Açık' : 'Sessiz Mod'}</span>
          </button>
        </div>
      </div>

      {/* Firestore Error Alert */}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Session Completed Banner */}
      {completionBanner && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 flex items-start justify-between gap-4 animate-fadeIn ${
            completionBanner.type === 'focus'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl text-white shrink-0 ${
                completionBanner.type === 'focus' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">{completionBanner.title}</h3>
              <p className="text-xs opacity-90 mt-1 leading-relaxed">{completionBanner.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCompletionBanner(null)}
            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shrink-0"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Centered Pomodoro Focus Stage / Fullscreen Focus Container */}
      <div ref={containerRef}>
        {isFullscreen ? (
          <FullscreenFocusView
            mode={mode === 'focus' ? 'work' : 'break'}
            formattedTime={formatCountdown(remainingSeconds)}
            progressRatio={progressRatio}
            isRunning={isRunning}
            isDark={isDark}
            controlsVisible={controlsVisible}
            subtitle={focusTopic.trim() || (mode === 'focus' ? 'Tam Konsantrasyon Modu' : 'Nefes Al & Dinlen')}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            onExitFullscreen={() => void exitFullscreen()}
            onUserActivity={handleActivity}
            onControlsHover={keepControlsVisible}
          />
        ) : (
      <Card className="max-w-3xl mx-auto p-6 sm:p-10 bg-white dark:bg-[#0f172a]/90 border-slate-200 dark:border-slate-800/90 relative overflow-hidden shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-black/50">
        {/* Ambient Background Glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            mode === 'focus'
              ? 'bg-brand-purple/10 dark:bg-brand-purple/15'
              : 'bg-cyan-500/10 dark:bg-blue-500/15'
          }`}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Mode Switcher Tabs: Odak (25 dk) / Mola (5 dk) */}
          <div
            role="tablist"
            aria-label="Pomodoro Modu"
            className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950/85 border border-slate-200 dark:border-slate-800/90 inline-flex items-center gap-1 mb-6"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'focus'}
              onClick={() => switchMode('focus')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                mode === 'focus'
                  ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white shadow-md shadow-brand-purple/25'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Flame
                className={`w-4 h-4 ${
                  mode === 'focus' ? 'text-amber-300 fill-amber-300/20' : 'text-amber-500'
                }`}
              />
              <span>Odak ({focusDuration} dk)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'break'}
              onClick={() => switchMode('break')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                mode === 'break'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Coffee
                className={`w-4 h-4 ${
                  mode === 'break' ? 'text-cyan-100' : 'text-cyan-600 dark:text-cyan-400'
                }`}
              />
              <span>Mola ({breakDuration} dk)</span>
            </button>
          </div>

          {/* Focus Topic Input */}
          <div className="w-full max-w-md mb-6">
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                placeholder="Ne çalışıyorsun? (ör. AYT Matematik - Limit)"
                className="w-full bg-slate-50 dark:bg-slate-950/75 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition"
              />
            </div>
          </div>

          {/* Large Centered Countdown Ring */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-1">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 292 292">
              <defs>
                <linearGradient id="pomodoroRingGrad" x1="0" y1="0" x2="1" y2="1">
                  {mode === 'focus' ? (
                    <>
                      <stop offset="0%" stopColor="#818CF8" />
                      <stop offset="55%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </>
                  )}
                </linearGradient>
              </defs>

              <circle
                cx="146"
                cy="146"
                r={radius}
                stroke={trackStroke}
                strokeWidth="11"
                fill="transparent"
              />

              <circle
                cx="146"
                cy="146"
                r={radius}
                stroke="url(#pomodoroRingGrad)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.35s ease-out',
                  filter:
                    mode === 'focus'
                      ? 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.45))'
                      : 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.45))'
                }}
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center space-y-2 px-4">
              <span
                className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
                  mode === 'focus'
                    ? 'bg-purple-50 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight border-purple-200 dark:border-brand-purple/30'
                    : 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                }`}
              >
                {mode === 'focus'
                  ? isRunning
                    ? 'Odaklanılıyor'
                    : 'Odak Oturumu'
                  : isRunning
                  ? 'Mola Akıyor'
                  : 'Kısa Mola'}
              </span>

              <div className="font-mono tabular-nums text-6xl sm:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatCountdown(remainingSeconds)}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
                {focusTopic.trim()
                  ? focusTopic.trim()
                  : mode === 'focus'
                  ? 'Tam Konsantrasyon Modu'
                  : 'Nefes Al & Dinlen'}
              </p>
            </div>
          </div>

          {/* Timer Action Controls: Başlat / Duraklat / Sıfırla */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <button
              type="button"
              onClick={handleStart}
              disabled={isRunning}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                isRunning
                  ? 'bg-slate-200 text-slate-400 dark:bg-slate-800/70 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white shadow-lg shadow-brand-purple/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Başlat</span>
            </button>

            <button
              type="button"
              onClick={handlePause}
              disabled={!isRunning}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                !isRunning
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-600 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Duraklat</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Sıfırla</span>
            </button>
          </div>

          {/* Preset & Custom Duration Controls */}
          <div className="mt-7 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 w-full max-w-lg space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => applyDurations(25, 5)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  focusDuration === 25 && breakDuration === 5
                    ? 'bg-purple-50 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight border-purple-200 dark:border-brand-purple/40'
                    : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Klasik 25 / 5 dk
              </button>
              <button
                type="button"
                onClick={() => applyDurations(50, 10)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  focusDuration === 50 && breakDuration === 10
                    ? 'bg-purple-50 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight border-purple-200 dark:border-brand-purple/40'
                    : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Derin Odak 50 / 10 dk
              </button>
              <button
                type="button"
                onClick={() => setShowCustomControls((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-purple dark:text-brand-purpleLight" />
                <span>Süreyi Özelleştir</span>
              </button>
            </div>

            {showCustomControls && (
              <form
                onSubmit={handleCustomDurationSubmit}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 animate-fadeIn"
              >
                <div className="flex-1 text-left">
                  <label
                    htmlFor="pomodoro-focus-mins"
                    className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Odak (dk)
                  </label>
                  <input
                    id="pomodoro-focus-mins"
                    type="number"
                    min={1}
                    max={180}
                    value={customFocusInput}
                    onChange={(e) => setCustomFocusInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white text-center focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <div className="flex-1 text-left">
                  <label
                    htmlFor="pomodoro-break-mins"
                    className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Mola (dk)
                  </label>
                  <input
                    id="pomodoro-break-mins"
                    type="number"
                    min={1}
                    max={60}
                    value={customBreakInput}
                    onChange={(e) => setCustomBreakInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white text-center focus:outline-none focus:border-brand-purple"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white text-xs font-semibold transition shrink-0"
                >
                  Uygula
                </button>
              </form>
            )}
          </div>
        </div>
      </Card>
        )}
      </div>

      {/* Summary Metrics + Firestore studySessions History */}
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Bugünkü Pomodoro
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoadingSessions ? '...' : `${todayStats.todayCount} Seans`}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight border border-purple-200 dark:border-brand-purple/30">
              <Sparkles className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Bugün Odaklanılan
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {isLoadingSessions ? '...' : `${todayStats.todayMinutes} dk`}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Clock className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Toplam Oda Kaydı
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isLoadingSessions ? '...' : `${todayStats.totalMinutes} dk`}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* Completed Sessions List */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Tamamlanan Odak Seansları
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bitirdiğin her odak oturumu Firestore studySessions koleksiyonunda saklanır.
              </p>
            </div>
            {isSavingSession && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-purple dark:text-brand-purpleLight">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Kaydediliyor...
              </span>
            )}
          </div>

          {isLoadingSessions ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-7 h-7 text-brand-purple dark:text-brand-purpleLight animate-spin mb-2.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Çalışma odası kayıtları yükleniyor...
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Headphones className="w-9 h-9 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Henüz tamamlanmış bir Pomodoro seansın yok.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                İlk {focusDuration} dakikalık odak seansını tamamladığında burada listelenecek.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80 mt-2">
              {sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {session.focusTopic || 'Pomodoro Odak Seansı'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{session.date}</span>
                        {formatSessionTime(session.completedAt) && (
                          <>
                            <span>•</span>
                            <span>{formatSessionTime(session.completedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant="emerald">+{session.minutes} dk</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
