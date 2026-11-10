import React from 'react';
import { Menu, Calendar, Clock, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
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

      {/* Right side: YKS Countdown & Quick badges */}
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

        {/* Notifications Icon */}
        <button 
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition"
          title="Bildirimler"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-purple" />
        </button>
      </div>
    </header>
  );
};
