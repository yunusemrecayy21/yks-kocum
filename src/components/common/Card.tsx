import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`relative rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-slate-800/80 p-6 transition-all duration-300 hover:border-slate-700/80 ${
        glow ? 'shadow-glow-purple' : 'shadow-card'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
