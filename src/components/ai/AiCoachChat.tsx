import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, RotateCcw, Sparkles, AlertTriangle } from 'lucide-react';
import { useAiCoach } from '../../context/AiCoachContext';

interface AiCoachChatProps {
  compact?: boolean;
  headerExtra?: React.ReactNode;
}

const STARTER_PROMPTS = [
  'Merhaba Koç!',
  'TYT netlerimi nasıl artırabilirim?',
  'Günlük verimli ders programı öner',
  'Sınav stresiyle nasıl başa çıkabilirim?'
];

export const AiCoachChat: React.FC<AiCoachChatProps> = ({
  compact = false,
  headerExtra
}) => {
  const { messages, isLoading, sendMessage, clearMessages } = useAiCoach();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const textToSend = inputValue;
    setInputValue('');
    await sendMessage(textToSend);
  };

  const handleStarterClick = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a]/90 backdrop-blur-xl">
      {/* Chat Header */}
      <div className="px-4 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-purple/25 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white truncate">Yapay Zeka Koçu</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-purpleLight" />
              <span>YKS Strateji & Motivasyon Asistanı</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={clearMessages}
            disabled={isLoading}
            title="Sohbeti Temizle"
            aria-label="Sohbeti Temizle"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 disabled:opacity-50 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {headerExtra}
        </div>
      </div>

      {/* Scrollable Message History */}
      <div
        className={`flex-1 overflow-y-auto space-y-4 ${
          compact ? 'p-4' : 'p-5 sm:p-6'
        }`}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end animate-fadeIn">
                <div className="max-w-[82%] space-y-1">
                  <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-brand-purple to-indigo-600 text-white px-4 py-2.5 text-sm leading-relaxed shadow-md shadow-brand-purple/20 whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  <span className="block text-[10px] text-slate-500 text-right pr-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex items-start gap-2.5 justify-start animate-fadeIn">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                  msg.isError
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-brand-purple/15 border-brand-purple/30 text-brand-purpleLight'
                }`}
              >
                {msg.isError ? <AlertTriangle className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="max-w-[85%] space-y-1">
                <div
                  className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap border ${
                    msg.isError
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200 text-xs'
                      : 'bg-slate-900/90 border-slate-800/90 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="block text-[10px] text-slate-500 pl-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Quick Starter Prompts (shown before user sends first message) */}
        {messages.length === 1 && !isLoading && (
          <div className="pt-1 pl-9 flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleStarterClick(prompt)}
                className="text-left text-[11px] font-medium px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-brand-purple/20 text-slate-300 hover:text-brand-purpleLight border border-slate-800 hover:border-brand-purple/40 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Loading Indicator ("Koç düşünüyor...") */}
        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start animate-fadeIn">
            <div className="w-7 h-7 rounded-xl bg-brand-purple/15 border border-brand-purple/30 flex items-center justify-center text-brand-purpleLight shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-900/90 border border-slate-800/90 px-4 py-3 flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand-purpleLight animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand-purpleLight animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand-purpleLight animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-xs font-medium text-slate-400 animate-pulse">
                Koç düşünüyor...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input & Send Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3.5 border-t border-slate-800/80 bg-slate-950/70 flex items-center gap-2.5 shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          placeholder="Koçuna YKS ile ilgili bir soru sor..."
          className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 disabled:opacity-60 transition-all"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          aria-label="Mesaj Gönder"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-brand-purple/25 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className={compact ? 'sr-only' : 'hidden sm:inline'}>Gönder</span>
        </button>
      </form>
    </div>
  );
};
