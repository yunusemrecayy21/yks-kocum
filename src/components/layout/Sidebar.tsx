import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Timer,
  Bot,
  User,
  Sparkles, 
  GraduationCap, 
  Target,
  Flame,
  LogOut,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PwaInstallButton } from '../pwa/PwaInstallButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, onboardingProfile, isTytOnly, logout } = useAuth();
  const navigate = useNavigate();

  const displayUsername = user?.username || 'Öğrenci';
  const initials = displayUsername.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navigationItems = [
    {
      name: 'Ana Sayfa (Dashboard)',
      path: '/',
      icon: LayoutDashboard,
      badge: 'Özet',
    },
    {
      name: 'Günlük Çalışma Programım',
      path: '/program',
      icon: CheckSquare,
      badge: 'To-Do',
    },
    {
      name: 'Çalışma Sayacı',
      path: '/sayac',
      icon: Timer,
      badge: 'Odak',
    },
    {
      name: 'Deneme Netlerim',
      path: '/denemeler',
      icon: BarChart3,
      badge: isTytOnly ? 'TYT' : 'TYT/AYT',
    },
    {
      name: 'Yapay Zeka Koçu',
      path: '/koc',
      icon: Bot,
      badge: 'AI',
    },
    {
      name: 'Profilim',
      path: '/profile',
      icon: User,
      badge: 'Hesap',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 dark:bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#0b1120] border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">YKS Koçum</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-brand-purple/20 text-purple-700 dark:text-brand-purpleLight border border-purple-200 dark:border-brand-purple/30">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-subtext">Akıllı Gelişim Takibi</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Menü
          </div>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-50 via-purple-50/50 to-transparent dark:from-brand-purple/20 dark:via-brand-purple/10 dark:to-transparent text-brand-purpleDark dark:text-white border-l-4 border-brand-purple shadow-sm dark:shadow-brand-purple/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isActive
                            ? 'text-brand-purple dark:text-brand-purpleLight'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-purple-100 dark:bg-brand-purple/20 text-purple-700 dark:text-brand-purpleLight border-purple-200 dark:border-brand-purple/30'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Motivation Quote Card */}
          <div className="pt-8">
            <div className="p-4 rounded-xl bg-gradient-to-b from-purple-50/70 to-slate-50 dark:from-[#151c30] dark:to-[#0f172a] border border-purple-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-10 text-brand-purple">
                <Target className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-2 text-brand-purple dark:text-brand-purpleLight text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Günün Koçluk Notu</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed relative z-10">
                "Zorluklar seni yolundan alıkoymak için değil, azmini ortaya çıkarmak içindir. Bugünün 1 saati yarının neti!"
              </p>
            </div>
          </div>
        </div>

        {/* Student Profile Quick View & Logout */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#090e1b]/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-purple to-indigo-600 flex items-center justify-center font-bold text-sm text-white border border-brand-purple/30 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayUsername}</p>
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              </div>
              <p className="text-[11px] text-brand-purple dark:text-brand-purpleLight/90 font-medium truncate">
                {onboardingProfile
                  ? `${onboardingProfile.gradeLevel} · ${onboardingProfile.studyField}`
                  : 'YKS Öğrencisi'}
              </p>
              {onboardingProfile && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {onboardingProfile.targetUniversity} - {onboardingProfile.targetDepartment}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/profile');
              }}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-brand-purple dark:hover:text-brand-purpleLight hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition shrink-0"
              title="Profil & Hedef Ayarları"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <PwaInstallButton variant="sidebar" />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 bg-white dark:bg-slate-900/90 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  );
};
