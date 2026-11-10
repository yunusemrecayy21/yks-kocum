import React from 'react';
import { Minimize2, Play, Pause, RotateCcw, Flame, Coffee } from 'lucide-react';

interface FullscreenFocusViewProps {
  mode: 'work' | 'break';
  formattedTime: string;
  progressRatio: number;
  isRunning: boolean;
  isDark: boolean;
  controlsVisible: boolean;
  subtitle?: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onExitFullscreen: () => void;
  onUserActivity: () => void;
  onControlsHover: () => void;
}

export const FullscreenFocusView: React.FC<FullscreenFocusViewProps> = ({
  mode,
  formattedTime,
  progressRatio,
  isRunning,
  isDark,
  controlsVisible,
  subtitle,
  onStart,
  onPause,
  onReset,
  onExitFullscreen,
  onUserActivity,
  onControlsHover
}) => {
  const radius = 162;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const trackStroke = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <div
      onMouseMove={onUserActivity}
      onMouseDown={onUserActivity}
      onTouchStart={onUserActivity}
      className="fixed inset-0 z-[100] h-screen w-screen bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none transition-colors duration-300"
    >
      {/* Subtle Breathing Ambient Glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${
          mode === 'work'
            ? 'bg-brand-purple/15 dark:bg-brand-purple/20'
            : 'bg-sky-500/15 dark:bg-blue-500/20'
        }`}
      />

      {/* Mouse-Activated Top-Right Exit Button */}
      <div
        onMouseEnter={onControlsHover}
        onMouseLeave={onUserActivity}
        className={`fixed top-6 right-6 z-20 transition-all duration-300 ${
          controlsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={onExitFullscreen}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-md transition"
        >
          <Minimize2 className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
          <span>Tam Ekrandan Çık</span>
          <span className="hidden sm:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </button>
      </div>

      {/* Centered Giant Timer Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[430px] md:h-[430px] flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 360 360">
            <defs>
              <linearGradient id="fullscreenTimerRingGrad" x1="0" y1="0" x2="1" y2="1">
                {mode === 'work' ? (
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
              cx="180"
              cy="180"
              r={radius}
              stroke={trackStroke}
              strokeWidth="10"
              fill="transparent"
            />

            <circle
              cx="180"
              cy="180"
              r={radius}
              stroke="url(#fullscreenTimerRingGrad)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.35s ease-out',
                filter:
                  mode === 'work'
                    ? 'drop-shadow(0 0 14px rgba(139, 92, 246, 0.5))'
                    : 'drop-shadow(0 0 14px rgba(59, 130, 246, 0.5))'
              }}
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center px-4 space-y-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full border ${
                mode === 'work'
                  ? 'bg-purple-50 dark:bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight border-purple-200 dark:border-brand-purple/30'
                  : 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
              }`}
            >
              {mode === 'work' ? (
                <Flame className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Coffee className="w-3.5 h-3.5 text-cyan-500" />
              )}
              <span>
                {mode === 'work'
                  ? isRunning
                    ? 'Derin Odaklanma'
                    : 'Çalışmaya Hazır'
                  : 'Mola Süresi'}
              </span>
            </span>

            <div className="font-mono tabular-nums text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              {formattedTime}
            </div>

            {subtitle && (
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mouse-Activated Bottom Compact Controls */}
      <div
        onMouseEnter={onControlsHover}
        onMouseLeave={onUserActivity}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          controlsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {!isRunning ? (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-purple/25 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Başlat</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Duraklat</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
          title="Sayacı Sıfırla"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Sıfırla</span>
        </button>
      </div>
    </div>
  );
};
