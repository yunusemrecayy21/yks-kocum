import React, { useState, useEffect, useRef } from 'react';
import { Menu, Calendar, Clock, Bell, BellOff, CheckCheck } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [markedReadFeedback, setMarkedReadFeedback] = useState(false);
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

  return (
    <header className="h-20 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      {/* Left side: Hamburger button + Date */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-xs font-medium text-slate-400 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-brand-purpleLight" />
          <span className="capitalize">{todayFormatted}</span>
        </div>
      </div>

      {/* Right side: YKS Countdown, Focus Mode & Notifications Dropdown */}
      <div className="flex items-center gap-3">
        {/* YKS Countdown Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-brand-purple/15 to-indigo-600/10 border border-brand-purple/30 px-3.5 py-1.5 rounded-xl text-xs">
          <Clock className="w-4 h-4 text-brand-purpleLight" />
          <div className="flex items-baseline gap-1">
            <span className="text-slate-400 hidden md:inline">YKS'ye:</span>
            <span className="font-bold text-white tracking-wide">{diffDays} Gün</span>
          </div>
        </div>

        {/* Focus Mode indicator */}
        <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Odak Modu Aktif</span>
        </div>

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
                ? 'bg-brand-purple/15 text-white border-brand-purple/50 shadow-glow-purple'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Glassmorphism Notification Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-2xl bg-[#0f172a]/85 backdrop-blur-xl border border-slate-800/90 shadow-2xl shadow-black/60 overflow-hidden z-50 animate-fadeIn">
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Bildirimler</span>
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-purpleLight hover:text-white bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/25 px-2.5 py-1 rounded-lg transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{markedReadFeedback ? 'Okundu' : 'Tümünü Okundu İşaretle'}</span>
                </button>
              </div>

              {/* Empty State Body */}
              <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-3 text-brand-purpleLight/80 shadow-inner">
                  <BellOff className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Şu an yeni bildiriminiz yok.
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Çalışma hatırlatmaları ve koçluk bildirimleri burada görünecek.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
