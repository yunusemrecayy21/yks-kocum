import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { AiCoachChat } from '../../components/ai/AiCoachChat';
import { useAuth } from '../../context/AuthContext';

export const AiCoachPage: React.FC = () => {
  const { onboardingProfile } = useAuth();

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-brand-purple" />
            Yapay Zeka Koçu
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            YKS çalışma stratejileri, zaman yönetimi, konu taktikleri ve motivasyon desteği için 7/24 yanında.
          </p>
        </div>

        {onboardingProfile && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-purple/10 border border-brand-purple/25 text-xs text-brand-purple dark:text-brand-purpleLight font-medium self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {onboardingProfile.gradeLevel} · {onboardingProfile.studyField} Modu
            </span>
          </div>
        )}
      </div>

      {/* Main Chat Card */}
      <div className="h-[calc(100vh-14.5rem)] min-h-[480px] rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/90 shadow-2xl shadow-slate-200/70 dark:shadow-black/60 overflow-hidden">
        <AiCoachChat />
      </div>
    </div>
  );
};
