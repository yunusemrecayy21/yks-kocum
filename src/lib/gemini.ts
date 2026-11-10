import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ?? '';

export const AI_COACH_SYSTEM_INSTRUCTION =
  'Sen YKS (TYT ve AYT) öğrencilerine destek olan, arkadaş canlısı, motive edici ve uzman bir eğitim koçusun. Sadece ders çalışma stratejileri, YKS konuları, motivasyon ve zaman yönetimi hakkında kısa, net ve destekleyici cevaplar vermelisin. Öğrenci sana selam verdiğinde ona YKS sürecinde nasıl yardımcı olabileceğini sor.';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const aiCoachModel = genAI
  ? genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: AI_COACH_SYSTEM_INSTRUCTION
    })
  : null;

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isWelcome?: boolean;
  isError?: boolean;
}

/**
 * Sends a prompt to Gemini 1.5 Flash while keeping multi-turn conversation context.
 * Synthetic welcome/error messages are stripped so history always starts with a 'user' turn.
 */
export const sendMessageToAiCoach = async (
  historyMessages: ChatMessage[],
  userMessage: string,
  studentContext?: {
    gradeLevel?: string;
    studyField?: string;
    targetUniversity?: string;
    targetDepartment?: string;
  }
): Promise<string> => {
  if (!genAI) {
    throw new Error('VITE_GEMINI_API_KEY ortam değişkeni tanımlı değil.');
  }

  const validHistory: Content[] = [];
  const conversationalMessages = historyMessages.filter(
    (msg) => !msg.isWelcome && !msg.isError
  );

  // Ensure strictly alternating user -> model turns starting with 'user'
  for (const msg of conversationalMessages) {
    if (validHistory.length === 0 && msg.role !== 'user') {
      continue;
    }
    const lastRole = validHistory[validHistory.length - 1]?.role;
    if (lastRole === msg.role) {
      continue;
    }
    validHistory.push({
      role: msg.role,
      parts: [{ text: msg.text }]
    });
  }

  // If the last history message was a 'user' message without a model reply, drop it
  if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
    validHistory.pop();
  }

  const model = studentContext
    ? genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `${AI_COACH_SYSTEM_INSTRUCTION} Öğrenci profili: ${studentContext.gradeLevel ?? ''} ${studentContext.studyField ?? ''} öğrencisi, hedefi ${studentContext.targetUniversity ?? ''} - ${studentContext.targetDepartment ?? ''}.`
      })
    : aiCoachModel!;

  const chat = model.startChat({
    history: validHistory
  });

  const result = await chat.sendMessage(userMessage);
  const responseText = result.response.text();
  return responseText.trim();
};
