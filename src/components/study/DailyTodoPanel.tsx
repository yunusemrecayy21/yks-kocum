import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  CheckSquare,
  BookOpen,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateKey } from '../../utils/date';
import {
  fetchTasks,
  addTaskToFirestore,
  toggleTaskInFirestore,
  deleteTaskFromFirestore
} from '../../services/firestoreService';
import type { StudyTask, Subject } from '../../types';

const SUBJECT_LIST: Subject[] = [
  'Matematik',
  'Geometri',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Edebiyat',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'Yabancı Dil'
];

interface DailyTodoPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DailyTodoPanel: React.FC<DailyTodoPanelProps> = ({
  isCollapsed,
  onToggleCollapse
}) => {
  const { user, isTytOnly } = useAuth();
  const userId = user?.uid;

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // New task form state
  const [subject, setSubject] = useState<Subject>('Matematik');
  const [topic, setTopic] = useState<string>('');
  const [duration, setDuration] = useState<string>('45');
  const [category, setCategory] = useState<'TYT' | 'AYT' | 'Tekrar' | 'Soru Çözümü'>('TYT');

  const activeCategory: 'TYT' | 'AYT' | 'Tekrar' | 'Soru Çözümü' =
    isTytOnly && category === 'AYT' ? 'TYT' : category;

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const loadTasks = async () => {
      try {
        const fetched = await fetchTasks(userId);
        if (isMounted) {
          setTasks(fetched);
        }
      } catch (err) {
        console.error('Firestore tasks fetch error:', err);
        if (isMounted) {
          setErrorMsg('Görevler Firestore veritabanından yüklenirken bir hata oluştu.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const toggleTask = async (task: StudyTask) => {
    const nextCompleted = !task.completed;
    setErrorMsg(null);

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      await toggleTaskInFirestore(task.id, nextCompleted);
    } catch (err) {
      console.error('Firestore task update error:', err);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      setErrorMsg('Görev durumu güncellenemedi. Lütfen bağlantınızı kontrol edin.');
    }
  };

  const deleteTask = async (id: string) => {
    const previousTasks = tasks;
    setErrorMsg(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTaskFromFirestore(id);
    } catch (err) {
      console.error('Firestore task delete error:', err);
      setTasks(previousTasks);
      setErrorMsg('Görev silinemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !topic.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await addTaskToFirestore(userId, {
        subject,
        topic: topic.trim(),
        durationMinutes: Number(duration) || 30,
        completed: false,
        date: getLocalDateKey(),
        category: activeCategory
      });

      setTasks((prev) => [created, ...prev]);
      setTopic('');
      setIsAdding(false);
    } catch (err) {
      console.error('Firestore task add error:', err);
      setErrorMsg('Görev eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveTasks = userId ? tasks : [];
  const effectiveLoading = Boolean(userId) && isLoading;
  const visibleTasks = isTytOnly
    ? effectiveTasks.filter((t) => t.category !== 'AYT')
    : effectiveTasks;
  const completedCount = visibleTasks.filter((t) => t.completed).length;
  const progressPercent =
    visibleTasks.length > 0 ? Math.round((completedCount / visibleTasks.length) * 100) : 0;

  const filteredTasks = visibleTasks.filter((task) => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  if (isCollapsed) {
    return (
      <aside className="w-full xl:w-14 shrink-0">
        <div className="rounded-2xl bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 flex xl:flex-col items-center justify-between gap-3 shadow-sm">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Günlük Plan Panelini Aç"
            className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple dark:text-brand-purpleLight hover:bg-brand-purple hover:text-white transition"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
          <div className="flex xl:flex-col items-center gap-2 text-center">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {completedCount}/{visibleTasks.length}
            </span>
            <span className="text-[10px] font-semibold text-brand-purple dark:text-brand-purpleLight">
              %{progressPercent}
            </span>
          </div>
          <span className="xl:hidden text-xs font-medium text-slate-500 dark:text-slate-400">
            Günlük Yapılacaklar (Gizli)
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full xl:w-[310px] 2xl:w-[330px] shrink-0">
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-card flex flex-col overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-purple/15 dark:bg-brand-purple/20 border border-brand-purple/30 flex items-center justify-center shrink-0">
                <CheckSquare className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  Günlük Yapılacaklar
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {completedCount}/{visibleTasks.length} görev tamamlandı
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAdding((prev) => !prev)}
                disabled={effectiveLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-purple hover:bg-brand-purpleHover disabled:opacity-60 text-white text-xs font-semibold shadow-sm shadow-brand-purple/20 transition"
                title="Günlük Görev Ekle"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>

              <button
                type="button"
                onClick={onToggleCollapse}
                title="Paneli Daralt"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slim Progress Bar */}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-purple to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-brand-purple dark:text-brand-purpleLight tabular-nums">
              %{progressPercent}
            </span>
          </div>

          {/* Compact Filter Pills */}
          <div className="mt-3 grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                filter === 'all'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Tümü ({visibleTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                filter === 'pending'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Kalan ({visibleTasks.length - completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                filter === 'completed'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Biten ({completedCount})
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-3 mt-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-2.5 flex items-center gap-2 text-[11px] text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Compact Add Form */}
        {isAdding && (
          <form
            onSubmit={handleAddTask}
            className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-purple-50/40 dark:bg-slate-800/40 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-purple dark:text-brand-purpleLight" />
                Yeni Günlük Görev
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5"
              >
                <span>Kapat</span>
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="ör. Paragraf 40 soru çöz"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-purple transition"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-purple transition"
              >
                {SUBJECT_LIST.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              <select
                value={activeCategory}
                onChange={(e) => setCategory(e.target.value as StudyTask['category'])}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-purple transition"
              >
                <option value="TYT">TYT</option>
                {!isTytOnly && <option value="AYT">AYT</option>}
                <option value="Soru Çözümü">Soru Çözümü</option>
                <option value="Tekrar">Konu Tekrarı</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
                  aria-label="Süre (dakika)"
                />
                <span className="text-[11px] text-slate-400 shrink-0">dk</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 bg-brand-purple hover:bg-brand-purpleHover disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{isSubmitting ? 'Ekleniyor' : 'Kaydet'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Task Items List */}
        <div className="p-3 space-y-2 max-h-[380px] xl:max-h-[580px] overflow-y-auto">
          {effectiveLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-5 h-5 text-brand-purple dark:text-brand-purpleLight animate-spin mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Görevler yükleniyor...</p>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="py-7 px-3 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bugün için görev eklenmedi
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Kendi günlük özel görevlerini buradan hızlıca ekleyebilirsin.
              </p>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-purple/10 hover:bg-brand-purple text-brand-purple dark:text-brand-purpleLight hover:text-white text-[11px] font-semibold transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Görev Ekle</span>
                </button>
              )}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {filter === 'completed'
                ? 'Henüz tamamlanan görev yok.'
                : 'Bekleyen görev kalmadı!'}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`group rounded-xl border p-2.5 transition-all duration-200 ${
                  task.completed
                    ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 opacity-75'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-brand-purple/40 dark:hover:border-slate-600 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-purple dark:hover:text-brand-purpleLight transition"
                      aria-label="Görevi tamamla"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/15" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-brand-purple" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug break-words ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {task.topic}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[11px] font-medium text-brand-purple dark:text-brand-purpleLight">
                          {task.subject}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {task.durationMinutes} dk
                        </span>
                        <Badge
                          variant={
                            task.category === 'AYT'
                              ? 'purple'
                              : task.category === 'TYT'
                              ? 'midnight'
                              : 'slate'
                          }
                          className="!px-1.5 !py-0 !text-[10px]"
                        >
                          {task.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded-lg text-slate-400 dark:text-slate-500 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition shrink-0"
                    title="Görevi Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom quick expand hint when form closed & tasks exist */}
        {!isAdding && visibleTasks.length > 0 && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-2 px-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-brand-purple dark:hover:text-brand-purpleLight hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-1 transition"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Hızlı Görev Ekle</span>
          </button>
        )}
      </div>
    </aside>
  );
};
