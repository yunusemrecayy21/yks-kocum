import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection
} from '@dnd-kit/core';
import {
  LayoutGrid,
  Search,
  X,
  RotateCcw,
  Cloud,
  CloudOff,
  Loader2,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Sparkles
} from 'lucide-react';
import {
  CURRICULUM_SUBJECTS,
  EXAM_CATEGORIES,
  SUBJECTS_BY_EXAM,
  CURRICULUM_TOTALS,
  ALL_CURRICULUM_TOPICS,
  type ExamCategory,
  type KanbanColumnId,
  type CurriculumTopic
} from '../data/subjectsData';
import { useAuth } from '../context/AuthContext';
import {
  fetchKanbanProgressFromFirestore,
  saveKanbanProgressToFirestore
} from '../services/firestoreService';
import { DailyTodoPanel } from '../components/study/DailyTodoPanel';
import { KanbanColumn, type KanbanColumnConfig } from '../components/study/KanbanColumn';
import { KanbanTopicCard } from '../components/study/KanbanTopicCard';

const KANBAN_COLUMNS: readonly KanbanColumnConfig[] = [
  {
    id: 'todo',
    title: 'Çalışılacak Konular',
    subtitle: 'Planlanan müfredat konuları',
    emptyText: 'Bu dersteki tüm konuları çalışmaya başladın veya tamamladın.'
  },
  {
    id: 'in_progress',
    title: 'Şu An Çalıştıklarım',
    subtitle: 'Aktif odaklandığın konular',
    emptyText: 'Çalışmaya başladığın konuları bu sütuna sürükleyip bırak.'
  },
  {
    id: 'done',
    title: 'Bitirdiğim Konular',
    subtitle: 'Tamamlanan ve oturan konular',
    emptyText: 'Bitirdiğin konuları buraya sürükleyerek ilerlemeni kaydet.'
  }
];

interface StoredProgressPayload {
  progress: Record<string, KanbanColumnId>;
  updatedAt: number;
}

interface StoredFilterSelection {
  exam: ExamCategory;
  subjectId: string;
}

const PROGRESS_KEY_PREFIX = 'yks_kanban_progress_';
const SELECTION_KEY_PREFIX = 'yks_kanban_selection_';

const loadLocalProgress = (scope: string): StoredProgressPayload => {
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${scope}`);
    if (!raw) return { progress: {}, updatedAt: 0 };
    const parsed = JSON.parse(raw) as Partial<StoredProgressPayload>;
    const rawProgress = parsed.progress ?? {};
    const sanitized: Record<string, KanbanColumnId> = {};
    Object.entries(rawProgress).forEach(([k, v]) => {
      if (v === 'in_progress' || v === 'done') {
        sanitized[k] = v;
      }
    });
    return {
      progress: sanitized,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0
    };
  } catch {
    return { progress: {}, updatedAt: 0 };
  }
};

const saveLocalProgress = (
  scope: string,
  progress: Record<string, KanbanColumnId>,
  updatedAt: number
): void => {
  try {
    const payload: StoredProgressPayload = { progress, updatedAt };
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}${scope}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('LocalStorage write warning:', err);
  }
};

const loadLocalSelection = (scope: string, defaultExam: ExamCategory): StoredFilterSelection => {
  try {
    const raw = localStorage.getItem(`${SELECTION_KEY_PREFIX}${scope}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredFilterSelection>;
      if (
        (parsed.exam === 'TYT' || parsed.exam === 'AYT' || parsed.exam === 'YDT') &&
        typeof parsed.subjectId === 'string' &&
        SUBJECTS_BY_EXAM[parsed.exam].some((s) => s.id === parsed.subjectId)
      ) {
        return { exam: parsed.exam, subjectId: parsed.subjectId };
      }
    }
  } catch {
    // fallback below
  }

  const fallbackSubject =
    SUBJECTS_BY_EXAM[defaultExam].find((s) => s.name === 'Matematik') ??
    SUBJECTS_BY_EXAM[defaultExam][0];
  return { exam: defaultExam, subjectId: fallbackSubject.id };
};

const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

interface StudyProgramBoardProps {
  userId?: string;
  storageScope: string;
  defaultExam: ExamCategory;
}

const StudyProgramBoard: React.FC<StudyProgramBoardProps> = ({
  userId,
  storageScope,
  defaultExam
}) => {
  const [selectedExam, setSelectedExam] = useState<ExamCategory>(
    () => loadLocalSelection(storageScope, defaultExam).exam
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    () => loadLocalSelection(storageScope, defaultExam).subjectId
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTodoCollapsed, setIsTodoCollapsed] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  const [topicProgress, setTopicProgress] = useState<Record<string, KanbanColumnId>>(
    () => loadLocalProgress(storageScope).progress
  );
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'local'>(
    userId ? 'loading' : 'local'
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const writeSequenceRef = useRef<number>(0);

  // Sensors: Mouse drags after 6px; Touch drags after 180ms hold so column scrolling stays smooth
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8
      }
    }),
    useSensor(KeyboardSensor)
  );

  // Persist active exam/subject filter locally
  useEffect(() => {
    try {
      localStorage.setItem(
        `${SELECTION_KEY_PREFIX}${storageScope}`,
        JSON.stringify({ exam: selectedExam, subjectId: selectedSubjectId })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [storageScope, selectedExam, selectedSubjectId]);

  // Reconcile topic progress from Firestore users collection on mount
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const localData = loadLocalProgress(storageScope);

    const syncFromFirestore = async () => {
      try {
        const remote = await fetchKanbanProgressFromFirestore(userId);
        if (!isMounted) return;

        if (remote && remote.updatedAt >= localData.updatedAt) {
          setTopicProgress(remote.progress);
          saveLocalProgress(storageScope, remote.progress, remote.updatedAt);
          setSyncState('saved');
        } else if (
          Object.keys(localData.progress).length > 0 &&
          localData.updatedAt > (remote?.updatedAt ?? 0)
        ) {
          await saveKanbanProgressToFirestore(userId, localData.progress, localData.updatedAt);
          if (isMounted) setSyncState('saved');
        } else {
          setSyncState('saved');
        }
      } catch (err) {
        console.error('Firestore kanban progress sync error:', err);
        if (isMounted) setSyncState('local');
      }
    };

    void syncFromFirestore();

    return () => {
      isMounted = false;
    };
  }, [userId, storageScope]);

  const persistProgress = useCallback(
    async (nextProgress: Record<string, KanbanColumnId>) => {
      const updatedAt = Date.now();
      saveLocalProgress(storageScope, nextProgress, updatedAt);

      if (!userId) {
        setSyncState('local');
        return;
      }

      const seq = ++writeSequenceRef.current;
      setSyncState('saving');

      try {
        await saveKanbanProgressToFirestore(userId, nextProgress, updatedAt);
        if (writeSequenceRef.current === seq) {
          setSyncState('saved');
        }
      } catch (err) {
        console.error('Firestore kanban save error:', err);
        if (writeSequenceRef.current === seq) {
          setSyncState('local');
        }
      }
    },
    [storageScope, userId]
  );

  const handleExamChange = (nextExam: ExamCategory) => {
    setSelectedExam(nextExam);
    setSearchQuery('');
    setConfirmResetOpen(false);

    const currentSubject = CURRICULUM_SUBJECTS.find((s) => s.id === selectedSubjectId);
    const nextSubjects = SUBJECTS_BY_EXAM[nextExam];
    const matchingByName = currentSubject
      ? nextSubjects.find((s) => s.name === currentSubject.name)
      : undefined;

    setSelectedSubjectId((matchingByName ?? nextSubjects[0]).id);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSearchQuery('');
    setConfirmResetOpen(false);
  };

  const handleMoveTopicStatus = useCallback(
    (topicId: string, nextStatus: KanbanColumnId) => {
      setTopicProgress((prev) => {
        const currentStatus = prev[topicId] ?? 'todo';
        if (currentStatus === nextStatus) return prev;

        const next = { ...prev };
        if (nextStatus === 'todo') {
          delete next[topicId];
        } else {
          next[topicId] = nextStatus;
        }

        void persistProgress(next);
        return next;
      });
    },
    [persistProgress]
  );

  const activeSubject = useMemo(
    () =>
      CURRICULUM_SUBJECTS.find((s) => s.id === selectedSubjectId) ??
      SUBJECTS_BY_EXAM[selectedExam][0],
    [selectedSubjectId, selectedExam]
  );

  const handleResetActiveSubject = () => {
    const subjectTopicIds = new Set(activeSubject.topics.map((t) => t.id));
    setTopicProgress((prev) => {
      const next: Record<string, KanbanColumnId> = {};
      Object.entries(prev).forEach(([id, status]) => {
        if (!subjectTopicIds.has(id)) {
          next[id] = status;
        }
      });
      void persistProgress(next);
      return next;
    });
    setConfirmResetOpen(false);
  };

  const filteredSubjectTopics = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return activeSubject.topics;
    return activeSubject.topics.filter(
      (t) =>
        t.title.toLocaleLowerCase('tr-TR').includes(q) ||
        String(t.order).includes(q)
    );
  }, [activeSubject, searchQuery]);

  const columnsTopics = useMemo(() => {
    const grouped: Record<KanbanColumnId, CurriculumTopic[]> = {
      todo: [],
      in_progress: [],
      done: []
    };

    filteredSubjectTopics.forEach((topic) => {
      const status = topicProgress[topic.id] ?? 'todo';
      grouped[status].push(topic);
    });

    return grouped;
  }, [filteredSubjectTopics, topicProgress]);

  // Subject stats (without search filter, so progress bar reflects full subject)
  const subjectStats = useMemo(() => {
    let done = 0;
    let inProgress = 0;
    activeSubject.topics.forEach((t) => {
      const s = topicProgress[t.id] ?? 'todo';
      if (s === 'done') done += 1;
      else if (s === 'in_progress') inProgress += 1;
    });
    const total = activeSubject.topicCount;
    const todo = total - done - inProgress;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { todo, inProgress, done, total, percent };
  }, [activeSubject, topicProgress]);

  // Global stats across all 533 topics
  const globalStats = useMemo(() => {
    let done = 0;
    let inProgress = 0;
    ALL_CURRICULUM_TOPICS.forEach((t) => {
      const s = topicProgress[t.id];
      if (s === 'done') done += 1;
      else if (s === 'in_progress') inProgress += 1;
    });
    const total = CURRICULUM_TOTALS.topicCount;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, inProgress, total, percent };
  }, [topicProgress]);

  const activeDragTopic = useMemo(() => {
    if (!activeDragId) return null;
    return activeSubject.topics.find((t) => t.id === activeDragId) ?? null;
  }, [activeDragId, activeSubject.topics]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const overId = String(over.id);
    if (overId === 'todo' || overId === 'in_progress' || overId === 'done') {
      handleMoveTopicStatus(String(active.id), overId);
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const currentExamSubjects = SUBJECTS_BY_EXAM[selectedExam];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <LayoutGrid className="w-7 h-7 text-brand-purple" />
              <span>Çalışma Programım</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 dark:bg-brand-purple/20 text-purple-700 dark:text-brand-purpleLight border border-purple-200 dark:border-brand-purple/30">
              <Sparkles className="w-3 h-3" />
              {CURRICULUM_TOTALS.subjectCount} Ders · {CURRICULUM_TOTALS.topicCount} Konu
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            YKS müfredatındaki tüm konuları sürükle-bırak Kanban panosuyla yönet, günlük hedeflerini sol panelden takip et.
          </p>
        </div>

        {/* Global Progress & Sync Indicator */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cloud / Local Sync Status */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
              syncState === 'saving' || syncState === 'loading'
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/25'
                : syncState === 'saved'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {syncState === 'saving' || syncState === 'loading' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{syncState === 'loading' ? 'Yükleniyor...' : 'Kaydediliyor...'}</span>
              </>
            ) : syncState === 'saved' ? (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>Buluta Kayıtlı</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5" />
                <span>Yerel Kayıt Aktif</span>
              </>
            )}
          </div>

          {/* Global YKS Completion Pill */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <GraduationCap className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {globalStats.done}/{globalStats.total}
              </span>{' '}
              <span className="text-slate-500 dark:text-slate-400">Konu Bitti</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 tabular-nums">
              %{globalStats.percent}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Compact Left To-Do Panel + Main Focus Kanban Board */}
      <div className="flex flex-col xl:flex-row items-start gap-5">
        {/* 1. Kompakt Günlük Plan (To-Do) Panel */}
        <DailyTodoPanel
          key={storageScope}
          isCollapsed={isTodoCollapsed}
          onToggleCollapse={() => setIsTodoCollapsed((prev) => !prev)}
        />

        {/* 2. Main Focus: Filter Bar + 3-Column Kanban Board */}
        <section className="flex-1 min-w-0 w-full space-y-5">
          {/* 3. Ders Seçimi ve Filtreleme Alanı */}
          <div className="rounded-2xl bg-white/95 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm dark:shadow-card space-y-4">
            {/* Step 1: Exam Category Switcher + Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Exam Tabs (TYT / AYT / YDT) */}
              <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 self-start">
                {EXAM_CATEGORIES.map((exam) => {
                  const isActive = selectedExam === exam.id;
                  const totals = CURRICULUM_TOTALS.byExam[exam.id];
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => handleExamChange(exam.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/25'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{exam.label}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {totals.subjectCount} ders · {totals.topicCount} konu
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`${activeSubject.name} konularında ara...`}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-purple transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Aramayı temizle"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Subject Selector Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {selectedExam} Ders Seçimi
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bir ders seçtiğinde tüm konuları Kanban panosuna yüklenir
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentExamSubjects.map((sub) => {
                  const isSelected = sub.id === activeSubject.id;
                  const doneInSub = sub.topics.reduce(
                    (acc, t) => (topicProgress[t.id] === 'done' ? acc + 1 : acc),
                    0
                  );
                  const isCompleted = doneInSub === sub.topicCount;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubjectChange(sub.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                        isSelected
                          ? 'bg-gradient-to-r from-brand-purple to-indigo-600 text-white border-brand-purple shadow-md shadow-brand-purple/20'
                          : isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400'
                          : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-purple/50 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      {isCompleted && (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'
                          }`}
                        />
                      )}
                      <span>{sub.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md tabular-nums ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {doneInSub}/{sub.topicCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Active Subject Progress Bar & Quick Reset */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 dark:bg-brand-purple/20 border border-brand-purple/25 flex items-center justify-center text-brand-purple dark:text-brand-purpleLight shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {activeSubject.examType} {activeSubject.name}
                    </h2>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {activeSubject.questionCount} Soru · {activeSubject.topicCount} Konu
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      %{subjectStats.percent} Tamamlandı
                    </span>
                  </div>

                  {/* Subject Progress Bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-purple via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${subjectStats.percent}%` }}
                      />
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                      <span>{subjectStats.todo} Bekleyen</span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {subjectStats.inProgress} Çalışılıyor
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {subjectStats.done} Bitti
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Active Subject Progress */}
              {(subjectStats.done > 0 || subjectStats.inProgress > 0) && (
                <div className="shrink-0">
                  {confirmResetOpen ? (
                    <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl px-2.5 py-1.5">
                      <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                        Sıfırlansın mı?
                      </span>
                      <button
                        type="button"
                        onClick={handleResetActiveSubject}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition"
                      >
                        Evet
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmResetOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Dersi Sıfırla</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3-Column Kanban Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={kanbanCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {KANBAN_COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  topics={columnsTopics[column.id]}
                  onMoveStatus={handleMoveTopicStatus}
                  isDragActive={Boolean(activeDragId)}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
              {activeDragTopic ? (
                <div className="w-[260px] sm:w-[280px]">
                  <KanbanTopicCard
                    topic={activeDragTopic}
                    status={topicProgress[activeDragTopic.id] ?? 'todo'}
                    isOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </section>
      </div>
    </div>
  );
};

export const StudyProgram: React.FC = () => {
  const { user, onboardingProfile } = useAuth();
  const userId = user?.uid;
  const storageScope = userId ?? 'guest';
  const defaultExam: ExamCategory =
    onboardingProfile?.studyField === 'Dil' ? 'YDT' : 'TYT';

  return (
    <StudyProgramBoard
      key={storageScope}
      userId={userId}
      storageScope={storageScope}
      defaultExam={defaultExam}
    />
  );
};

export default StudyProgram;
