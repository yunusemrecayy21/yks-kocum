import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Clock, 
  CheckSquare, 
  BookOpen
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import type { StudyTask, Subject } from '../../types';

const INITIAL_TASKS: StudyTask[] = [
  {
    id: '1',
    subject: 'Matematik',
    topic: 'Türev Geometrik Yorumu - 60 Soru',
    durationMinutes: 75,
    completed: true,
    date: new Date().toISOString().slice(0, 10),
    category: 'AYT'
  },
  {
    id: '2',
    subject: 'Fizik',
    topic: 'Manyetizma ve İndüksiyon Akımı Konu Özeti',
    durationMinutes: 45,
    completed: true,
    date: new Date().toISOString().slice(0, 10),
    category: 'AYT'
  },
  {
    id: '3',
    subject: 'Türkçe',
    topic: 'TYT Paragraf Denemesi (20 Soru Hız Egzersizi)',
    durationMinutes: 30,
    completed: true,
    date: new Date().toISOString().slice(0, 10),
    category: 'TYT'
  },
  {
    id: '4',
    subject: 'Biyoloji',
    topic: 'Genden Proteine Sentez Mekanizması',
    durationMinutes: 40,
    completed: false,
    date: new Date().toISOString().slice(0, 10),
    category: 'AYT'
  },
  {
    id: '5',
    subject: 'Kimya',
    topic: 'Gazlar Karma Test Çözümü',
    durationMinutes: 50,
    completed: false,
    date: new Date().toISOString().slice(0, 10),
    category: 'Soru Çözümü'
  },
];

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

export const DailySchedulePage: React.FC = () => {
  const { isTytOnly } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('yks_daily_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TASKS;
      }
    }
    return INITIAL_TASKS;
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New task form state
  const [subject, setSubject] = useState<Subject>('Matematik');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('45');
  const [category, setCategory] = useState<'TYT' | 'AYT' | 'Tekrar' | 'Soru Çözümü'>('TYT');

  useEffect(() => {
    localStorage.setItem('yks_daily_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (isTytOnly && category === 'AYT') {
      setCategory('TYT');
    }
  }, [isTytOnly, category]);

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const newTask: StudyTask = {
      id: Date.now().toString(),
      subject,
      topic: topic.trim(),
      durationMinutes: Number(duration) || 30,
      completed: false,
      date: new Date().toISOString().slice(0, 10),
      category: isTytOnly && category === 'AYT' ? 'TYT' : category
    };

    setTasks(prev => [newTask, ...prev]);
    setTopic('');
    setIsAdding(false);
  };

  const visibleTasks = isTytOnly ? tasks.filter(t => t.category !== 'AYT') : tasks;
  const completedCount = visibleTasks.filter(t => t.completed).length;
  const progressPercent = visibleTasks.length > 0 ? Math.round((completedCount / visibleTasks.length) * 100) : 0;

  const filteredTasks = visibleTasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-brand-purple" />
            Günlük Çalışma Programım
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Günün hedeflerini planla, konularını tamamladıkça işaretle ve ritmini koru.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white text-sm font-semibold shadow-lg shadow-brand-purple/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Görev Ekle</span>
        </button>
      </div>

      {/* Progress & Summary Bar */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-purple/20 to-blue-500/20 border border-brand-purple/30 flex items-center justify-center font-bold text-xl text-brand-purpleLight">
              %{progressPercent}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Bugünün Tamamlanma Oranı</h3>
              <p className="text-xs text-slate-400">
                Toplam <span className="text-white font-medium">{visibleTasks.length}</span> görevden{' '}
                <span className="text-emerald-400 font-medium">{completedCount}</span> tanesi bitti.
              </p>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === 'all'
                  ? 'bg-brand-purple text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({visibleTasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === 'pending'
                  ? 'bg-brand-purple text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yapılacaklar ({visibleTasks.length - completedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === 'completed'
                  ? 'bg-brand-purple text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bitenler ({completedCount})
            </button>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-purple to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Add Task Collapsible Panel */}
      {isAdding && (
        <Card className="p-6 border-brand-purple/40 bg-slate-900/90 shadow-glow-purple/20">
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-purpleLight" />
                Programa Yeni Çalışma Ekle
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Vazgeç
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Ders
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value as Subject)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition"
                >
                  {SUBJECT_LIST.map(sub => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition"
                >
                  <option value="TYT">TYT</option>
                  {!isTytOnly && <option value="AYT">AYT</option>}
                  <option value="Soru Çözümü">Soru Çözümü</option>
                  <option value="Tekrar">Konu Tekrarı</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Tahmini Süre (Dakika)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Konu / Hedef Başlığı
                </label>
                <input
                  type="text"
                  placeholder="ör. Trigonometri 50 Soru"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-purple hover:bg-brand-purpleHover text-white text-xs font-semibold rounded-xl transition shadow-md shadow-brand-purple/20"
              >
                Listeye Ekle
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">Bu filtrede görev bulunamadı</h3>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'completed'
                ? 'Henüz tamamlanmış görev yok. Haydi başla!'
                : 'Yeni bir çalışma eklemek için yukarıdaki butonu kullanabilirsin.'}
            </p>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card
              key={task.id}
              className={`p-4 transition-all duration-200 hover:border-slate-700 ${
                task.completed ? 'bg-slate-900/40 opacity-75' : 'bg-[#0f172a]/90'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="shrink-0 text-slate-400 hover:text-brand-purpleLight transition"
                    aria-label="Görevi tamamla"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 hover:text-brand-purple" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {task.topic}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-brand-purpleLight font-medium">
                        {task.subject}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {task.durationMinutes} dk
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge
                    variant={
                      task.category === 'AYT'
                        ? 'purple'
                        : task.category === 'TYT'
                        ? 'midnight'
                        : 'slate'
                    }
                  >
                    {task.category}
                  </Badge>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Görevi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
