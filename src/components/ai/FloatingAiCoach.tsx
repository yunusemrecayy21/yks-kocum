import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, X, Maximize2, Sparkles } from 'lucide-react';
import { AiCoachChat } from './AiCoachChat';

export const FloatingAiCoach: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide floating widget on the dedicated full-page AI Coach route
  if (location.pathname === '/koc') {
    return null;
  }

  return (
    <>
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[520px] max-h-[76vh] rounded-3xl border border-slate-800/90 shadow-2xl shadow-black/75 overflow-hidden animate-fadeIn">
          <AiCoachChat
            compact
            headerExtra={
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/koc');
                  }}
                  title="Tam Ekranda Aç"
                  aria-label="Tam Ekranda Aç"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Kapat"
                  aria-label="Kapat"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            }
          />
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Yapay Zeka Koçunu Kapat' : 'Yapay Zeka Koçunu Aç'}
        className={`fixed bottom-5 right-5 z-40 group inline-flex items-center gap-2.5 px-4 py-3.5 rounded-2xl font-semibold text-sm text-white shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            : 'bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 shadow-glow-purple hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? (
          <>
            <X className="w-5 h-5" />
            <span className="hidden sm:inline text-xs">Kapat</span>
          </>
        ) : (
          <>
            <div className="relative">
              <Bot className="w-5 h-5" />
              <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-wide">AI Koç</span>
          </>
        )}
      </button>
    </>
  );
};
