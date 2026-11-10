export const STORAGE_PREFIXES = {
  TASKS: 'yks_prod_tasks_',
  EXAMS: 'yks_prod_exams_',
  STUDY_STATS: 'yks_prod_study_stats_',
} as const;

export interface StudyStatsData {
  dailyMinutes: Record<string, number>;
  dailySessions: Record<string, number>;
}

export const EMPTY_STUDY_STATS: StudyStatsData = {
  dailyMinutes: {},
  dailySessions: {},
};

/**
 * Returns a user-scoped localStorage key.
 */
export const getUserStorageKey = (prefix: string, userId?: string): string => {
  return `${prefix}${userId ?? 'guest'}`;
};

/**
 * Returns YYYY-MM-DD formatted string in the user's local timezone.
 */
export const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Safely reads and parses JSON from localStorage with fallback.
 */
export const readLocalStorageJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/**
 * Safely writes JSON to localStorage.
 */
export const writeLocalStorageJson = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors cleanly
  }
};
