import React, { useState, useEffect, useRef } from 'react';
import { Menu, Calendar, Clock, Bell, BellOff, CheckCheck, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [markedReadFeedback, setMarkedReadFeedback] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const todayFormatted = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Approximate YKS calculation for 2027
  const examDate = new Date('2027-06-20T10:15:00');
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!notificationsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  const handleMarkAllAsRead = () => {
    setMarkedReadFeedback(true);
    setTimeout(() => {
      setMarkedReadFeedback(false);
    }, 1500);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Sign out error:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-20 bg-white/85 dark:bg-[#090D16]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between transition-colors duration-300">
      {/* Left side: Hamburger button + Date */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-brand-purple dark:text-brand-purpleLight" />
          <span className="capitalize">{todayFormatted}</span>
        </div>
      </div>

      {/* Right side: YKS Countdown, Focus Mode, Theme Toggle, Notifications & Sign Out */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* YKS Countdown Badge */}
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-indigo-950/80 border border-purple-200 dark:border-indigo-700/60 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-colors duration-200">
          <Clock className="w-4 h-4 text-brand-purple dark:text-indigo-300 shrink-0" />
          <div className="flex items-baseline gap-1">
            <span className="text-slate-600 dark:text-indigo-200 hidden md:inline">YKS'ye:</span>
            <span className="font-bold text-slate-900 dark:text-white tracking-wide">{diffDays} Gün</span>
          </div>
        </div>

        {/* Focus Mode indicator */}
        <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>Odak Modu Aktif</span>
        </div>

        {/* Light / Dark Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Aydınlık Temaya Geç' : 'Karanlık Temaya Geç'}
          title={isDark ? 'Aydınlık Temaya Geç' : 'Karanlık Temaya Geç'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-all duration-200"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-brand-purple" />
          )}
        </button>

        {/* Notifications Trigger + Dropdown */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            aria-expanded={notificationsOpen}
            aria-label="Bildirimler"
            title="Bildirimler"
            className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
              notificationsOpen
                ? 'bg-purple-50 dark:bg-brand-purple/15 text-brand-purple dark:text-white border-brand-purple/50 shadow-glow-purple'
                : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Glassmorphism Notification Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-2xl bg-white/95 dark:bg-[#0f172a]/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800/90 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden z-50 animate-fadeIn">
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Bildirimler</span>
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-purple dark:text-brand-purpleLight hover:text-white bg-purple-50 dark:bg-brand-purple/10 hover:bg-brand-purple dark:hover:bg-brand-purple/20 border border-purple-200 dark:border-brand-purple/25 px-2.5 py-1 rounded-lg transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{markedReadFeedback ? 'Okundu' : 'Tümünü Okundu İşaretle'}</span>
                </button>
              </div>

              {/* Empty State Body */}
              <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3 text-brand-purple dark:text-brand-purpleLight/80 shadow-inner">
                  <BellOff className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Şu an yeni bildiriminiz yok.
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Çalışma hatırlatmaları ve koçluk bildirimleri burada görünecek.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Çıkış Yap"
          aria-label="Çıkış Yap"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-500/30 disabled:opacity-60 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </div>
    </header>
  );
};
