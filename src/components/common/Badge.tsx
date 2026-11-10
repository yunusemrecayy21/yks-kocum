import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'midnight' | 'emerald' | 'amber' | 'slate';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'purple', 
  className = '' 
}) => {
  const variantStyles = {
    purple: 'bg-brand-purple/10 text-brand-purpleLight border-brand-purple/20',
    midnight: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
