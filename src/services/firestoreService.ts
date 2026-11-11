import {
  collection,
  query,
  where,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import type { KanbanColumnId } from '../data/subjectsData';
import type { MockExam, StudySession, StudyTask, TrialExam, UserOnboardingProfile } from '../types';

export interface StudyStatsData {
  dailyMinutes: Record<string, number>;
  dailySessions: Record<string, number>;
}

export interface StudyStatsRecord extends StudyStatsData {
  docId: string | null;
}

export const EMPTY_STUDY_STATS: StudyStatsRecord = {
  docId: null,
  dailyMinutes: {},
  dailySessions: {}
};

const TASKS_COLLECTION = 'tasks';
const EXAMS_COLLECTION = 'exams';
const MOCK_EXAMS_COLLECTION = 'mockExams';
const STATS_COLLECTION = 'stats';
const STUDY_SESSIONS_COLLECTION = 'studySessions';
const USERS_COLLECTION = 'users';
const USER_PROFILES_COLLECTION = 'userProfiles';
const LEGACY_PROFILES_COLLECTION = 'profiles';

// ==========================================
// TASKS (Günlük Çalışma Programım)
// ==========================================

export const fetchTasks = async (userId: string): Promise<StudyTask[]> => {
  const q = query(collection(db, TASKS_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const items = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      subject: data.subject,
      topic: data.topic,
      durationMinutes: data.durationMinutes ?? 30,
      completed: Boolean(data.completed),
      date: data.date,
      category: data.category,
      _createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0
    };
  });

  items.sort((a, b) => b._createdAt - a._createdAt);

  return items.map(({ _createdAt: _, ...task }) => task);
};

export const addTaskToFirestore = async (
  userId: string,
  taskData: Omit<StudyTask, 'id'>
): Promise<StudyTask> => {
  const payload = {
    userId,
    subject: taskData.subject,
    topic: taskData.topic,
    durationMinutes: taskData.durationMinutes ?? 30,
    completed: taskData.completed,
    date: taskData.date,
    category: taskData.category,
    createdAt: Date.now()
  };

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), payload);
  return {
    id: docRef.id,
    ...taskData
  };
};

export const toggleTaskInFirestore = async (
  taskId: string,
  completed: boolean
): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(taskRef, { completed });
};

export const deleteTaskFromFirestore = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(taskRef);
};

// ==========================================
// EXAMS (Deneme Netlerim)
// ==========================================

export const fetchExams = async (userId: string): Promise<TrialExam[]> => {
  const q = query(collection(db, EXAMS_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const items = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      examType: data.examType,
      ...(data.field ? { field: data.field } : {}),
      name: data.name,
      date: data.date,
      ...(data.publisher ? { publisher: data.publisher } : {}),
      scores: data.scores ?? { total: 0 },
      _createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0
    };
  });

  items.sort((a, b) => b._createdAt - a._createdAt);

  return items.map(({ _createdAt: _, ...exam }) => exam);
};

export const addExamToFirestore = async (
  userId: string,
  examData: Omit<TrialExam, 'id'>
): Promise<TrialExam> => {
  const cleanScores: TrialExam['scores'] = { total: examData.scores.total };
  Object.entries(examData.scores).forEach(([key, val]) => {
    if (val !== undefined) {
      (cleanScores as Record<string, number>)[key] = val;
    }
  });

  const payload = {
    userId,
    examType: examData.examType,
    name: examData.name,
    date: examData.date,
    scores: cleanScores,
    createdAt: Date.now(),
    ...(examData.field ? { field: examData.field } : {}),
    ...(examData.publisher ? { publisher: examData.publisher } : {})
  };

  const docRef = await addDoc(collection(db, EXAMS_COLLECTION), payload);
  return {
    id: docRef.id,
    ...examData,
    scores: cleanScores
  };
};

export const deleteExamFromFirestore = async (examId: string): Promise<void> => {
  const examRef = doc(db, EXAMS_COLLECTION, examId);
  await deleteDoc(examRef);
};

// ==========================================
// STUDY STATS (Çalışma Sayacı İstatistikleri)
// ==========================================

export const fetchStudyStats = async (userId: string): Promise<StudyStatsRecord> => {
  const q = query(collection(db, STATS_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return EMPTY_STUDY_STATS;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  return {
    docId: docSnap.id,
    dailyMinutes: data.dailyMinutes ?? {},
    dailySessions: data.dailySessions ?? {}
  };
};

export const saveStudyStatsToFirestore = async (
  userId: string,
  currentDocId: string | null,
  nextStats: StudyStatsData
): Promise<string> => {
  if (currentDocId) {
    const statsRef = doc(db, STATS_COLLECTION, currentDocId);
    await updateDoc(statsRef, {
      dailyMinutes: nextStats.dailyMinutes,
      dailySessions: nextStats.dailySessions,
      updatedAt: Date.now()
    });
    return currentDocId;
  }

  const docRef = await addDoc(collection(db, STATS_COLLECTION), {
    userId,
    dailyMinutes: nextStats.dailyMinutes,
    dailySessions: nextStats.dailySessions,
    updatedAt: Date.now()
  });

  return docRef.id;
};

// ==========================================
// USER PROFILES (Onboarding & Hedef Bilgileri)
// ==========================================

export const fetchUserProfile = async (
  userId: string
): Promise<UserOnboardingProfile | null> => {
  const q = query(collection(db, USER_PROFILES_COLLECTION), where('userId', '==', userId));
  let snapshot = await getDocs(q);

  // Fallback once to legacy 'profiles' collection if userProfiles has no doc yet
  if (snapshot.empty) {
    const legacyQ = query(
      collection(db, LEGACY_PROFILES_COLLECTION),
      where('userId', '==', userId)
    );
    snapshot = await getDocs(legacyQ);
  }

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0].data();
  if (
    typeof data.gradeLevel === 'string' &&
    typeof data.studyField === 'string' &&
    typeof data.targetUniversity === 'string' &&
    typeof data.targetDepartment === 'string'
  ) {
    return {
      gradeLevel: data.gradeLevel as UserOnboardingProfile['gradeLevel'],
      studyField: data.studyField as UserOnboardingProfile['studyField'],
      targetUniversity: data.targetUniversity,
      targetDepartment: data.targetDepartment,
      completedAt: data.completedAt ?? new Date().toISOString()
    };
  }

  return null;
};

export const saveUserProfileToFirestore = async (
  userId: string,
  profile: UserOnboardingProfile
): Promise<void> => {
  const q = query(collection(db, USER_PROFILES_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const existingDoc = snapshot.docs[0];
    await updateDoc(doc(db, USER_PROFILES_COLLECTION, existingDoc.id), {
      gradeLevel: profile.gradeLevel,
      studyField: profile.studyField,
      targetUniversity: profile.targetUniversity,
      targetDepartment: profile.targetDepartment,
      completedAt: profile.completedAt,
      updatedAt: Date.now()
    });
    return;
  }

  await addDoc(collection(db, USER_PROFILES_COLLECTION), {
    userId,
    gradeLevel: profile.gradeLevel,
    studyField: profile.studyField,
    targetUniversity: profile.targetUniversity,
    targetDepartment: profile.targetDepartment,
    completedAt: profile.completedAt,
    updatedAt: Date.now()
  });
};

// ==========================================
// STUDY SESSIONS (Canlı Çalışma Odası - Pomodoro)
// ==========================================

export const fetchStudySessions = async (userId: string): Promise<StudySession[]> => {
  const q = query(collection(db, STUDY_SESSIONS_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const items: StudySession[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: String(data.userId ?? userId),
      date: typeof data.date === 'string' ? data.date : '',
      minutes: typeof data.minutes === 'number' ? data.minutes : 25,
      ...(typeof data.focusTopic === 'string' && data.focusTopic.trim()
        ? { focusTopic: data.focusTopic }
        : {}),
      completedAt:
        typeof data.completedAt === 'string' ? data.completedAt : new Date().toISOString(),
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0
    };
  });

  items.sort((a, b) => b.createdAt - a.createdAt);
  return items;
};

export const addStudySessionToFirestore = async (
  userId: string,
  sessionData: {
    date: string;
    minutes: number;
    focusTopic?: string;
  }
): Promise<StudySession> => {
  const createdAt = Date.now();
  const completedAt = new Date().toISOString();
  const cleanTopic = sessionData.focusTopic?.trim();

  const payload = {
    userId,
    date: sessionData.date,
    minutes: sessionData.minutes,
    completedAt,
    createdAt,
    ...(cleanTopic ? { focusTopic: cleanTopic } : {})
  };

  const docRef = await addDoc(collection(db, STUDY_SESSIONS_COLLECTION), payload);

  return {
    id: docRef.id,
    userId,
    date: sessionData.date,
    minutes: sessionData.minutes,
    completedAt,
    createdAt,
    ...(cleanTopic ? { focusTopic: cleanTopic } : {})
  };
};

// ==========================================
// MOCK EXAMS (TYT / AYT Deneme Sonuçları ve Grafik)
// ==========================================

export const fetchMockExams = async (userId: string): Promise<MockExam[]> => {
  const q = query(collection(db, MOCK_EXAMS_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const items: MockExam[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: String(data.userId ?? userId),
      name: typeof data.name === 'string' && data.name.trim() ? data.name : 'Deneme Sınavı',
      date: typeof data.date === 'string' ? data.date : '',
      tytNet: typeof data.tytNet === 'number' ? data.tytNet : null,
      aytNet: typeof data.aytNet === 'number' ? data.aytNet : null,
      ...(data.field ? { field: data.field } : {}),
      ...(typeof data.publisher === 'string' && data.publisher.trim()
        ? { publisher: data.publisher }
        : {}),
      ...(data.tytBreakdown ? { tytBreakdown: data.tytBreakdown } : {}),
      ...(data.aytBreakdown ? { aytBreakdown: data.aytBreakdown } : {}),
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0
    };
  });

  items.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (!Number.isNaN(dateDiff) && dateDiff !== 0) return dateDiff;
    return b.createdAt - a.createdAt;
  });

  return items;
};

export const addMockExamToFirestore = async (
  userId: string,
  examData: Omit<MockExam, 'id' | 'userId' | 'createdAt'>
): Promise<MockExam> => {
  const createdAt = Date.now();
  const cleanPublisher = examData.publisher?.trim();

  const payload = {
    userId,
    name: examData.name.trim(),
    date: examData.date,
    tytNet: examData.tytNet,
    aytNet: examData.aytNet,
    createdAt,
    ...(examData.field ? { field: examData.field } : {}),
    ...(cleanPublisher ? { publisher: cleanPublisher } : {}),
    ...(examData.tytBreakdown && Object.keys(examData.tytBreakdown).length > 0
      ? { tytBreakdown: examData.tytBreakdown }
      : {}),
    ...(examData.aytBreakdown && Object.keys(examData.aytBreakdown).length > 0
      ? { aytBreakdown: examData.aytBreakdown }
      : {})
  };

  const docRef = await addDoc(collection(db, MOCK_EXAMS_COLLECTION), payload);

  return {
    id: docRef.id,
    userId,
    name: payload.name,
    date: payload.date,
    tytNet: payload.tytNet,
    aytNet: payload.aytNet,
    createdAt,
    ...(examData.field ? { field: examData.field } : {}),
    ...(cleanPublisher ? { publisher: cleanPublisher } : {}),
    ...(payload.tytBreakdown ? { tytBreakdown: payload.tytBreakdown } : {}),
    ...(payload.aytBreakdown ? { aytBreakdown: payload.aytBreakdown } : {})
  };
};

export const deleteMockExamFromFirestore = async (examId: string): Promise<void> => {
  await deleteDoc(doc(db, MOCK_EXAMS_COLLECTION, examId));
};

// ==========================================
// USERS (Kullanıcı Hesap Kaydı - Ad Soyad)
// ==========================================

export const saveUserRecordToFirestore = async (
  userId: string,
  userData: {
    email: string;
    fullName: string;
  }
): Promise<void> => {
  const cleanName = userData.fullName.trim();
  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      userId,
      email: userData.email.trim(),
      fullName: cleanName,
      displayName: cleanName,
      updatedAt: Date.now()
    },
    { merge: true }
  );
};

// ==========================================
// KANBAN KONU TAKİBİ (users koleksiyonu)
// ==========================================

export interface UserKanbanRecord {
  progress: Record<string, KanbanColumnId>;
  updatedAt: number;
}

const isValidKanbanStatus = (val: unknown): val is KanbanColumnId =>
  val === 'todo' || val === 'in_progress' || val === 'done';

export const fetchKanbanProgressFromFirestore = async (
  userId: string
): Promise<UserKanbanRecord | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  const rawProgress = data.kanbanProgress;
  if (!rawProgress || typeof rawProgress !== 'object') {
    return null;
  }

  const sanitized: Record<string, KanbanColumnId> = {};
  Object.entries(rawProgress as Record<string, unknown>).forEach(([topicId, status]) => {
    if (isValidKanbanStatus(status) && status !== 'todo') {
      sanitized[topicId] = status;
    }
  });

  return {
    progress: sanitized,
    updatedAt: typeof data.kanbanUpdatedAt === 'number' ? data.kanbanUpdatedAt : 0
  };
};

export const saveKanbanProgressToFirestore = async (
  userId: string,
  progress: Record<string, KanbanColumnId>,
  updatedAt: number = Date.now()
): Promise<void> => {
  const cleanProgress: Record<string, KanbanColumnId> = {};
  Object.entries(progress).forEach(([topicId, status]) => {
    if (isValidKanbanStatus(status) && status !== 'todo') {
      cleanProgress[topicId] = status;
    }
  });

  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      userId,
      kanbanProgress: cleanProgress,
      kanbanUpdatedAt: updatedAt,
      updatedAt
    },
    { merge: true }
  );
};
