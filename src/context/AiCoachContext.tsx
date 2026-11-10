import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { sendMessageToAiCoach } from '../lib/gemini';
import type { ChatMessage } from '../lib/gemini';

interface AiCoachContextValue {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

const AiCoachContext = createContext<AiCoachContextValue | undefined>(undefined);

const createWelcomeMessage = (username?: string): ChatMessage => ({
  id: 'welcome-msg',
  role: 'model',
  text: `Merhaba ${username || 'Şampiyon'}! 👋 Ben senin YKS Yapay Zeka Eğitim Koçunum. Çalışma stratejileri, TYT/AYT konu planlaması, zaman yönetimi veya motivasyon hakkında bana dilediğini sorabilirsin. Bugün sana nasıl yardımcı olabilirim?`,
  timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
  isWelcome: true
});

export const AiCoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, onboardingProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(user?.username)
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset conversation cleanly when active user changes
  useEffect(() => {
    setMessages([createWelcomeMessage(user?.username)]);
    setIsLoading(false);
  }, [user?.uid, user?.username]);

  const clearMessages = useCallback(() => {
    setMessages([createWelcomeMessage(user?.username)]);
  }, [user?.username]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || isLoading) return;

      const timeStr = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: timeStr
      };

      const historySnapshot = [...messages];
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const replyText = await sendMessageToAiCoach(
          historySnapshot,
          trimmed,
          onboardingProfile
            ? {
                gradeLevel: onboardingProfile.gradeLevel,
                studyField: onboardingProfile.studyField,
                targetUniversity: onboardingProfile.targetUniversity,
                targetDepartment: onboardingProfile.targetDepartment
              }
            : undefined
        );

        const aiMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: replyText || 'Şu an yanıt üretemedim, lütfen soruyu biraz daha açık sorar mısın?',
          timestamp: new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        console.error('Gemini AI Coach error:', err);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'model',
          text: 'Üzgünüm, şu an yapay zeka koçuna bağlanırken bir sorun oluştu. Lütfen internet bağlantını ve Gemini API anahtarını kontrol edip tekrar dene.',
          timestamp: new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isError: true
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, onboardingProfile]
  );

  return (
    <AiCoachContext.Provider value={{ messages, isLoading, sendMessage, clearMessages }}>
      {children}
    </AiCoachContext.Provider>
  );
};

export const useAiCoach = (): AiCoachContextValue => {
  const ctx = useContext(AiCoachContext);
  if (!ctx) {
    throw new Error('useAiCoach must be used within an AiCoachProvider');
  }
  return ctx;
};
