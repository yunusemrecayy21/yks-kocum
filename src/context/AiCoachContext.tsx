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

const createWelcomeMessage = (displayName?: string | null): ChatMessage => ({
  id: 'welcome-msg',
  role: 'model',
  text: `Merhaba ${displayName?.trim() || 'Öğrenci'}! 👋 Ben senin YKS Yapay Zeka Eğitim Koçunum. Çalışma stratejileri, TYT/AYT konu planlaması, zaman yönetimi veya motivasyon hakkında bana dilediğini sorabilirsin. Bugün sana nasıl yardımcı olabilirim?`,
  timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
  isWelcome: true
});

export const AiCoachProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, onboardingProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(user?.displayName)
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset conversation cleanly when active user changes
  useEffect(() => {
    setMessages([createWelcomeMessage(user?.displayName)]);
    setIsLoading(false);
  }, [user?.uid, user?.displayName]);

  const clearMessages = useCallback(() => {
    setMessages([createWelcomeMessage(user?.displayName)]);
  }, [user?.displayName]);

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
        const errorDetails = err as {
          message?: string;
          status?: number;
          statusText?: string;
          errorDetails?: unknown;
        };
        const rawMessage = errorDetails?.message ?? String(err);

        console.error('[AiCoachContext Error]', {
          message: rawMessage,
          status: errorDetails?.status,
          statusText: errorDetails?.statusText,
          errorDetails: errorDetails?.errorDetails,
          rawError: err
        });

        let userFriendlyError =
          'Üzgünüm, şu an yapay zeka koçuna bağlanırken bir sorun oluştu. Lütfen tekrar dene.';

        if (rawMessage.includes('VITE_GEMINI_API_KEY')) {
          userFriendlyError =
            'API anahtarı bulunamadı: VITE_GEMINI_API_KEY ortam değişkeni tanımlı değil.';
        } else if (
          rawMessage.includes('API_KEY_INVALID') ||
          errorDetails?.status === 400 ||
          errorDetails?.status === 401 ||
          errorDetails?.status === 403
        ) {
          userFriendlyError =
            'Gemini API anahtarı geçersiz veya yetkisiz görünüyor. Lütfen VITE_GEMINI_API_KEY ayarını kontrol edin.';
        } else if (errorDetails?.status === 404 || rawMessage.includes('404')) {
          userFriendlyError =
            'Seçilen Gemini modeli bulunamadı (404). Model adını kontrol edin.';
        } else if (errorDetails?.status === 429 || rawMessage.includes('429')) {
          userFriendlyError =
            'Gemini API kullanım kotası aşıldı. Lütfen kısa bir süre bekleyip tekrar deneyin.';
        }

        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'model',
          text: userFriendlyError,
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
