import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Flame, 
  Clock, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  BarChart2,
  Sliders,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Card } from '../../components/common/Card';

// 7-day realistic mock study data (Pazartesi -> Pazar)
const WEEKLY_STUDY_DATA = [
  { day: 'Pzt', hours: 4.5, target: 5.0, sessions: 5 },
  { day: 'Sal', hours: 5.2, target: 5.0, sessions: 6 },
  { day: 'Çar', hours: 6.0, target: 5.5, sessions: 7 },
  { day: 'Per', hours: 4.8, target: 5.0, sessions: 5 },
  { day: 'Cum', hours: 6.5, target: 6.0, sessions: 8 },
  { day: 'Cmt', hours: 7.2, target: 7.0, sessions: 9 },
  { day: 'Paz (Bugün)', hours: 4.25, target: 6.0, sessions: 5 },
];

export const StudyTimerPage: React.FC = () => {
  // Preset or custom durations (in minutes)
  const [workDuration, setWorkDuration] = useState<number>(50);
  const [breakDuration, setBreakDuration] = useState<number>(10);
  const [customWorkInput, setCustomWorkInput] = useState<string>('50');
  const [customBreakInput, setCustomBreakInput] = useState<string>('10');
  const [customApplied, setCustomApplied] = useState<boolean>(false);
  
  // Timer mode: 'work' or 'break'
  const [mode, setMode] = useState<'work' | 'break'>('work');
  
  // Remaining time in seconds
  const [remainingSeconds, setRemainingSeconds] = useState<number>(50 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Today's total study minutes (Stored in LocalStorage, initial: 255 mins = 4h 15m)
  const [todayStudyMinutes, setTodayStudyMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('yks_today_study_minutes');
    return saved ? parseInt(saved, 10) : 255;
  });

  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(() => {
    const saved = localStorage.getItem('yks_today_sessions_count');
    return saved ? parseInt(saved, 10) : 5;
  });

  // Modal / Notification when timer completes
  const [completionAlert, setCompletionAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Critical background protection timestamp reference
  const targetTimestampRef = useRef<number | null>(null);

  // Sync today's study minutes to localStorage
  useEffect(() => {
    localStorage.setItem('yks_today_study_minutes', todayStudyMinutes.toString());
    localStorage.setItem('yks_today_sessions_count', completedSessionsCount.toString());
  }, [todayStudyMinutes, completedSessionsCount]);

  // Clean Audio Chime via Web Audio API (No external file needed, background-safe)
  const playAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      // Harmonic chime (A5 -> D6)
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Main Background-Protected Timer Loop using Date.now() Timestamp
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (targetTimestampRef.current !== null) {
          const now = Date.now();
          const differenceMs = targetTimestampRef.current - now;
          const diffSeconds = Math.max(0, Math.ceil(differenceMs / 1000));

          setRemainingSeconds(diffSeconds);

          if (diffSeconds <= 0) {
            // Timer Finished!
            targetTimestampRef.current = null;
            setIsRunning(false);
            playAlarmSound();

            if (mode === 'work') {
              // Add completed duration to today's study total
              setTodayStudyMinutes(prev => prev + workDuration);
              setCompletedSessionsCount(prev => prev + 1);
              
              setCompletionAlert({
                show: true,
                title: 'Çalışma Seansı Başarıyla Tamamlandı! 🎉',
                message: `${workDuration} dakikalık odaklanma süren başarıyla kaydedildi. Şimdi ${breakDuration} dakikalık hak ettiğin molaya geçebilirsin.`
              });
              
              // Automatically switch to break mode
              setMode('break');
              setRemainingSeconds(breakDuration * 60);
            } else {
              setCompletionAlert({
                show: true,
                title: 'Mola Vakti Sona Erdi! ⚡',
                message: 'Zihnini dinlendirdin. Şimdi yeni bir çalışma seansıyla hedeflerine odaklanma zamanı!'
              });
              
              // Switch back to work mode
              setMode('work');
              setRemainingSeconds(workDuration * 60);
            }
          }
        }
      }, 250); // Frequent checks ensure precision when tab is resumed
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, workDuration, breakDuration, soundEnabled]);

  // Controls: Start
  const handleStart = () => {
    targetTimestampRef.current = Date.now() + remainingSeconds * 1000;
    setIsRunning(true);
  };

  // Controls: Pause
  const handlePause = () => {
    targetTimestampRef.current = null;
    setIsRunning(false);
  };

  // Controls: Reset
  const handleReset = () => {
    targetTimestampRef.current = null;
    setIsRunning(false);
    setRemainingSeconds(mode === 'work' ? workDuration * 60 : breakDuration * 60);
  };

  // Mode Switch
  const switchMode = (newMode: 'work' | 'break') => {
    handlePause();
    setMode(newMode);
    setRemainingSeconds(newMode === 'work' ? workDuration * 60 : breakDuration * 60);
  };

  // Set Preset Configurations
  const applyPreset = (workMins: number, breakMins: number) => {
    handlePause();
    setWorkDuration(workMins);
    setBreakDuration(breakMins);
    setCustomWorkInput(String(workMins));
    setCustomBreakInput(String(breakMins));
    setRemainingSeconds(mode === 'work' ? workMins * 60 : breakMins * 60);
  };

  // Apply Custom Duration Inputs
  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWork = Math.min(240, Math.max(1, parseInt(customWorkInput, 10) || workDuration));
    const parsedBreak = Math.min(120, Math.max(1, parseInt(customBreakInput, 10) || breakDuration));

    applyPreset(parsedWork, parsedBreak);
    setCustomApplied(true);
    setTimeout(() => setCustomApplied(false), 1800);
  };

  // Circular Progress calculations
  const totalSecondsForMode = (mode === 'work' ? workDuration : breakDuration) * 60;
  const progressRatio = totalSecondsForMode > 0 ? remainingSeconds / totalSecondsForMode : 0;
  
  // SVG Ring values
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Time format MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Format today's total study time
  const todayHours = Math.floor(todayStudyMinutes / 60);
  const todayRemainingMins = todayStudyMinutes % 60;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-brand-purple" />
            Çalışma Sayacı & Odaklanma
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Geri sayım sayacıyla ders çalış, sekme arka plandayken bile süren aksın ve haftalık verimini analiz et.
          </p>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition self-start sm:self-auto ${
            soundEnabled 
              ? 'bg-slate-900 text-brand-purpleLight border-brand-purple/30' 
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={soundEnabled ? 'Zil Sesi Açık' : 'Zil Sesi Kapalı'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-brand-purpleLight" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? 'Zil Aktif' : 'Zil Sessizde'}</span>
        </button>
      </div>

      {/* Completion Modal / Notification Banner */}
      {completionAlert?.show && (
        <div className="relative rounded-2xl bg-gradient-to-r from-brand-purple/20 via-indigo-600/20 to-purple-900/20 border border-brand-purple/40 p-5 shadow-glow-purple flex items-start justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-brand-purple text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{completionAlert.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{completionAlert.message}</p>
            </div>
          </div>
          <button
            onClick={() => setCompletionAlert(null)}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Main Focus Timer Card with Circular Progress Ring */}
      <Card className="p-8 sm:p-10 border-slate-800/90 bg-[#0f172a]/90 relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Selector Tabs */}
        <div className="relative z-10 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-1 mb-8">
          <button
            onClick={() => switchMode('work')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              mode === 'work'
                ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white shadow-md shadow-brand-purple/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>Ders Çalışma ({workDuration} dk)</span>
          </button>

          <button
            onClick={() => switchMode('break')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              mode === 'break'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4 text-cyan-400" />
            <span>Mola Süresi ({breakDuration} dk)</span>
          </button>
        </div>

        {/* Circular Progress Ring with Digital Display */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
            <defs>
              <linearGradient id="timerRingGradient" x1="0" y1="0" x2="1" y2="1">
                {mode === 'work' ? (
                  <>
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="60%" stopColor="#8B5CF6" />
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

            {/* Background track circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="#1E293B"
              strokeWidth="10"
              fill="transparent"
            />

            {/* Glowing animated progress circle */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="url(#timerRingGradient)"
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.4s ease-out',
                filter: mode === 'work' ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
              }}
            />
          </svg>

          {/* Centered Digital Countdown Content */}
          <div className="absolute flex flex-col items-center justify-center space-y-2">
            <span className={`text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
              mode === 'work'
                ? 'bg-brand-purple/15 text-brand-purpleLight border-brand-purple/30'
                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            }`}>
              {mode === 'work' ? (isRunning ? 'Odaklanılıyor...' : 'Çalışmaya Hazır') : 'Mola Veriliyor'}
            </span>

            {/* Big Modern Digital Monospace Clock */}
            <div className="font-mono text-5xl sm:text-6xl font-extrabold text-white tracking-wider drop-shadow-md">
              {formattedTime}
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {mode === 'work' ? 'Hedef: Tam Konsantrasyon' : 'Rahatla & Dinlen'}
            </p>
          </div>
        </div>

        {/* Action Controls: Play / Pause / Reset */}
        <div className="flex items-center gap-4 mt-6">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-purple/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Başlat</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Pause className="w-5 h-5 fill-slate-950" />
              <span>Duraklat</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="Sayacı Sıfırla"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Duration Customization / Preset Pills */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 w-full max-w-xl">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-purpleLight" />
              Hızlı Süre Ayarları
            </span>
            <span>Özel Değer Seçin</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => applyPreset(25, 5)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                workDuration === 25 && breakDuration === 5
                  ? 'bg-brand-purple/15 text-brand-purpleLight border-brand-purple/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Klasik 25 / 5 dk
            </button>
            <button
              onClick={() => applyPreset(50, 10)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                workDuration === 50 && breakDuration === 10
                  ? 'bg-brand-purple/15 text-brand-purpleLight border-brand-purple/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Derin Odak 50 / 10 dk
            </button>
            <button
              onClick={() => applyPreset(60, 15)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                workDuration === 60 && breakDuration === 15
                  ? 'bg-brand-purple/15 text-brand-purpleLight border-brand-purple/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Maraton 60 / 15 dk
            </button>
          </div>

          {/* Custom Duration Setter */}
          <form onSubmit={handleApplyCustom} className="mt-5 pt-5 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
              <span className="text-slate-300 font-semibold">Özel Süre Belirle</span>
              <span className="text-[11px] text-slate-500">Kendi çalışma & mola süreni gir</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1 text-left">
                <label
                  htmlFor="custom-work-input"
                  className="block text-[11px] font-medium text-slate-400 mb-1.5"
                >
                  Çalışma (dk)
                </label>
                <input
                  id="custom-work-input"
                  type="number"
                  min={1}
                  max={240}
                  value={customWorkInput}
                  onChange={e => setCustomWorkInput(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white text-center focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 focus:shadow-[0_0_18px_rgba(139,92,246,0.28)] transition-all"
                />
              </div>

              <div className="flex-1 text-left">
                <label
                  htmlFor="custom-break-input"
                  className="block text-[11px] font-medium text-slate-400 mb-1.5"
                >
                  Mola (dk)
                </label>
                <input
                  id="custom-break-input"
                  type="number"
                  min={1}
                  max={120}
                  value={customBreakInput}
                  onChange={e => setCustomBreakInput(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white text-center focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/25 focus:shadow-[0_0_18px_rgba(139,92,246,0.28)] transition-all"
                />
              </div>

              <button
                type="submit"
                className={`inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold transition-all h-[42px] shrink-0 ${
                  customApplied
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/15'
                    : 'bg-brand-purple/90 hover:bg-brand-purple text-white border border-brand-purple/50 shadow-md shadow-brand-purple/20 hover:shadow-brand-purple/35'
                }`}
              >
                {customApplied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Uygulandı</span>
                  </>
                ) : (
                  <span>Uygula</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </Card>

      {/* Today's Total Study Time Banner (Attention Grabbing Card) */}
      <Card className="p-6 bg-gradient-to-r from-[#11192e] via-[#161c3d] to-[#0f172a] border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-purple to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-purple/20 shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-purpleLight uppercase tracking-wider block">
                Bugün Toplam Çalışılan Süre
              </span>
              <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {todayHours} Saat {todayRemainingMins} Dakika
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Her tamamlanan çalışma seansı bu süreye otomatik olarak eklenir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-xs text-slate-400 block">Tamamlanan Seans</span>
              <span className="text-xl font-bold text-emerald-400">{completedSessionsCount} Seans</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Bugün</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Günlük Hedef</span>
              <span className="text-xl font-bold text-white">6 Saat</span>
              <span className="text-[11px] text-brand-purpleLight block mt-0.5">
                %{Math.min(100, Math.round((todayStudyMinutes / 360) * 100))} Tamamlandı
              </span>
            </div>
          </div>
        </div>

        {/* Goal Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 mt-5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-purple via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (todayStudyMinutes / 360) * 100)}%` }}
          />
        </div>
      </Card>

      {/* Weekly Study Time Line Chart */}
      <Card className="p-6 border-slate-800/90 bg-[#0f172a]/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Son 1 Haftalık Çalışma Süresi Dağılımı
              </h2>
              <p className="text-xs text-slate-400">
                Gün gün odaklanma süreleri (Saat cinsinden)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-brand-purple" />
              <span>Çalışma (Saat)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-3 h-0.5 bg-blue-500 border-dashed" />
              <span>Hedef (5.5s)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEEKLY_STUDY_DATA} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="purpleTimerGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#C084FC" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

              <XAxis 
                dataKey="day" 
                stroke="#64748B" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E293B' }}
                dy={10}
              />

              <YAxis 
                stroke="#64748B" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E293B' }}
                domain={[0, 9]}
                dx={-5}
                unit="s"
              />

              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-[#090D16]/95 backdrop-blur-md border border-slate-700/80 p-3 shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-white">{d.day}</p>
                        <p className="text-brand-purpleLight font-bold text-sm">{d.hours} Saat</p>
                        <p className="text-slate-400 text-[11px]">{d.sessions} Odak Seansı</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Target benchmark reference line */}
              <ReferenceLine y={5.5} stroke="#3B82F6" strokeDasharray="4 4" strokeOpacity={0.4} />

              <Line
                type="monotone"
                dataKey="hours"
                name="Çalışma Süresi"
                stroke="url(#purpleTimerGlow)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: '#090D16',
                  stroke: '#8B5CF6',
                  strokeWidth: 2
                }}
                activeDot={{
                  r: 7,
                  fill: '#8B5CF6',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                  className: 'filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
