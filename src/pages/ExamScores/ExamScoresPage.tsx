import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  LineChart as LineChartIcon,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getLocalDateKey } from '../../utils/date';
import {
  fetchMockExams,
  addMockExamToFirestore,
  deleteMockExamFromFirestore,
  fetchExams,
  deleteExamFromFirestore
} from '../../services/firestoreService';
import type { MockExam, MockExamSubjectKey, StudyField, TrialExam } from '../../types';

interface ScoreFieldConfig {
  key: MockExamSubjectKey;
  label: string;
  shortLabel: string;
  max: number;
}

const TYT_FIELDS: ScoreFieldConfig[] = [
  { key: 'turkce', label: 'Türkçe', shortLabel: 'TR', max: 40 },
  { key: 'matematik', label: 'Matematik', shortLabel: 'MAT', max: 40 },
  { key: 'sosyal', label: 'Sosyal Bilimler', shortLabel: 'SOS', max: 20 },
  { key: 'fen', label: 'Fen Bilimleri', shortLabel: 'FEN', max: 20 }
];

const AYT_FIELDS_BY_STUDY_FIELD: Record<Exclude<StudyField, 'Sadece TYT'>, ScoreFieldConfig[]> = {
  'Sayısal': [
    { key: 'matematik', label: 'Matematik', shortLabel: 'MAT', max: 40 },
    { key: 'fen', label: 'Fen Bilimleri', shortLabel: 'FEN', max: 40 }
  ],
  'Eşit Ağırlık': [
    { key: 'matematik', label: 'Matematik', shortLabel: 'MAT', max: 40 },
    { key: 'edebiyat', label: 'Edebiyat', shortLabel: 'EDEB', max: 24 },
    { key: 'sosyal1', label: 'Sosyal-1', shortLabel: 'SOS-1', max: 16 }
  ],
  'Sözel': [
    { key: 'edebiyat', label: 'Edebiyat', shortLabel: 'EDEB', max: 24 },
    { key: 'sosyal1', label: 'Sosyal-1', shortLabel: 'SOS-1', max: 16 },
    { key: 'sosyal2', label: 'Sosyal-2', shortLabel: 'SOS-2', max: 40 }
  ],
  'Dil': [
    { key: 'ydt', label: 'Yabancı Dil (YDT)', shortLabel: 'YDT', max: 80 }
  ]
};

type ChartSeriesFilter = 'all' | 'tyt' | 'ayt';

interface UnifiedExamItem {
  id: string;
  source: 'mockExams' | 'exams';
  name: string;
  date: string;
  publisher?: string;
  field?: StudyField;
  tytNet: number | null;
  aytNet: number | null;
  tytBreakdown?: Partial<Record<'turkce' | 'matematik' | 'sosyal' | 'fen', number>>;
  aytBreakdown?: Partial<Record<MockExamSubjectKey, number>>;
  createdAt: number;
}

interface ChartDataPoint {
  xAxisLabel: string;
  fullName: string;
  date: string;
  publisher?: string;
  tytNet: number | null;
  aytNet: number | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

const formatShortDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}`;
};

const convertLegacyExam = (exam: TrialExam): UnifiedExamItem => {
  const breakdown: Partial<Record<MockExamSubjectKey, number>> = {};
  (Object.keys(exam.scores) as Array<keyof TrialExam['scores']>).forEach((k) => {
    if (k !== 'total' && typeof exam.scores[k] === 'number') {
      breakdown[k] = exam.scores[k];
    }
  });

  return {
    id: exam.id,
    source: 'exams',
    name: exam.name,
    date: exam.date,
    publisher: exam.publisher,
    field: exam.field,
    tytNet: exam.examType === 'TYT' ? exam.scores.total : null,
    aytNet: exam.examType === 'AYT' ? exam.scores.total : null,
    ...(exam.examType === 'TYT' ? { tytBreakdown: breakdown } : { aytBreakdown: breakdown }),
    createdAt: 0
  };
};

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-2xl bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 p-4 shadow-2xl text-xs space-y-2.5 min-w-[205px]">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <p className="font-bold text-slate-900 dark:text-white tracking-tight">{data.fullName}</p>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brand-purple dark:text-brand-purpleLight" />
            {data.date}
          </span>
          {data.publisher && (
            <>
              <span>•</span>
              <span className="truncate max-w-[100px]">{data.publisher}</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {data.tytNet !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 dark:bg-sky-400" />
              TYT Neti:
            </span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">
              {data.tytNet.toFixed(2)} Net
            </span>
          </div>
        )}

        {data.aytNet !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-purple dark:bg-purple-400" />
              AYT Neti:
            </span>
            <span className="font-bold text-brand-purple dark:text-purple-400 text-sm">
              {data.aytNet.toFixed(2)} Net
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ExamScoresPage: React.FC = () => {
  const { user, onboardingProfile, isTytOnly } = useAuth();
  const { isDark } = useTheme();
  const userId = user?.uid;

  const studyField = onboardingProfile?.studyField ?? 'Sayısal';
  const aytField: Exclude<StudyField, 'Sadece TYT'> =
    studyField === 'Sadece TYT' ? 'Sayısal' : studyField;
  const activeAytFields = AYT_FIELDS_BY_STUDY_FIELD[aytField];

  // Theme-aware chart styling tokens
  const chartGridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const chartAxisStroke = isDark ? '#94A3B8' : '#64748B';
  const chartAxisLineStroke = isDark ? '#334155' : '#CBD5E1';
  const chartDotFill = isDark ? '#090D16' : '#FFFFFF';
  const tytLineColor = isDark ? '#38BDF8' : '#0284C7';
  const aytLineColor = isDark ? '#A855F7' : '#7C3AED';

  // Firestore exam lists (mockExams + legacy exams compatibility)
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [legacyExams, setLegacyExams] = useState<TrialExam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Chart filter
  const [chartFilter, setChartFilter] = useState<ChartSeriesFilter>('all');

  // Add Exam Form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [showBreakdownCalculator, setShowBreakdownCalculator] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [publisher, setPublisher] = useState<string>('');
  const [date, setDate] = useState<string>(() => getLocalDateKey());
  const [tytNetInput, setTytNetInput] = useState<string>('');
  const [aytNetInput, setAytNetInput] = useState<string>('');
  const [tytSubjectInputs, setTytSubjectInputs] = useState<Record<string, string>>({});
  const [aytSubjectInputs, setAytSubjectInputs] = useState<Record<string, string>>({});

  // Load mockExams (and legacy exams) from Firestore
  useEffect(() => {
    if (!userId) {
      setMockExams([]);
      setLegacyExams([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadAllExams = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const [fetchedMocks, fetchedLegacy] = await Promise.all([
          fetchMockExams(userId),
          fetchExams(userId).catch(() => [] as TrialExam[])
        ]);

        if (isMounted) {
          setMockExams(fetchedMocks);
          setLegacyExams(fetchedLegacy);
        }
      } catch (err) {
        console.error('Firestore mockExams fetch error:', err);
        if (isMounted) {
          setErrorMsg('Deneme sonuçları Firestore veritabanından yüklenemedi.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAllExams();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Auto-sum TYT breakdown inputs into tytNetInput when subject calculator is used
  const handleTytSubjectChange = (key: string, value: string) => {
    const next = { ...tytSubjectInputs, [key]: value };
    setTytSubjectInputs(next);

    const hasAnyValue = Object.values(next).some((v) => v.trim() !== '');
    if (hasAnyValue) {
      const sum = TYT_FIELDS.reduce((acc, f) => acc + (parseFloat(next[f.key] ?? '') || 0), 0);
      setTytNetInput(sum.toFixed(2));
    } else {
      setTytNetInput('');
    }
    setFormError(null);
  };

  // Auto-sum AYT breakdown inputs into aytNetInput when subject calculator is used
  const handleAytSubjectChange = (key: string, value: string) => {
    const next = { ...aytSubjectInputs, [key]: value };
    setAytSubjectInputs(next);

    const hasAnyValue = Object.values(next).some((v) => v.trim() !== '');
    if (hasAnyValue) {
      const sum = activeAytFields.reduce(
        (acc, f) => acc + (parseFloat(next[f.key] ?? '') || 0),
        0
      );
      setAytNetInput(sum.toFixed(2));
    } else {
      setAytNetInput('');
    }
    setFormError(null);
  };

  const handleAddMockExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || isSubmitting) return;
    setFormError(null);

    if (!name.trim()) {
      setFormError('Lütfen deneme adını girin.');
      return;
    }

    if (!date) {
      setFormError('Lütfen deneme tarihini seçin.');
      return;
    }

    const parsedTyt = tytNetInput.trim() === '' ? null : parseFloat(tytNetInput);
    const parsedAyt = aytNetInput.trim() === '' ? null : parseFloat(aytNetInput);

    if (parsedTyt === null && parsedAyt === null) {
      setFormError('Lütfen en az bir TYT veya AYT neti girin.');
      return;
    }

    if (parsedTyt !== null && (Number.isNaN(parsedTyt) || parsedTyt < 0 || parsedTyt > 120)) {
      setFormError('TYT neti 0 ile 120 arasında geçerli bir sayı olmalıdır.');
      return;
    }

    if (parsedAyt !== null && (Number.isNaN(parsedAyt) || parsedAyt < 0 || parsedAyt > 80)) {
      setFormError('AYT neti 0 ile 80 arasında geçerli bir sayı olmalıdır.');
      return;
    }

    // Build optional subject breakdown payloads
    const tytBreakdown: NonNullable<MockExam['tytBreakdown']> = {};
    TYT_FIELDS.forEach((f) => {
      const raw = tytSubjectInputs[f.key];
      if (raw !== undefined && raw.trim() !== '' && !Number.isNaN(parseFloat(raw))) {
        tytBreakdown[f.key as keyof typeof tytBreakdown] = parseFloat(raw);
      }
    });

    const aytBreakdown: NonNullable<MockExam['aytBreakdown']> = {};
    activeAytFields.forEach((f) => {
      const raw = aytSubjectInputs[f.key];
      if (raw !== undefined && raw.trim() !== '' && !Number.isNaN(parseFloat(raw))) {
        aytBreakdown[f.key] = parseFloat(raw);
      }
    });

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await addMockExamToFirestore(userId, {
        name: name.trim(),
        date,
        publisher: publisher.trim() || undefined,
        field: parsedAyt !== null ? aytField : undefined,
        tytNet: parsedTyt !== null ? parseFloat(parsedTyt.toFixed(2)) : null,
        aytNet: parsedAyt !== null ? parseFloat(parsedAyt.toFixed(2)) : null,
        ...(Object.keys(tytBreakdown).length > 0 ? { tytBreakdown } : {}),
        ...(Object.keys(aytBreakdown).length > 0 ? { aytBreakdown } : {})
      });

      setMockExams((prev) =>
        [created, ...prev].sort((a, b) => {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
          return diff !== 0 ? diff : b.createdAt - a.createdAt;
        })
      );

      // Reset form
      setName('');
      setPublisher('');
      setTytNetInput('');
      setAytNetInput('');
      setTytSubjectInputs({});
      setAytSubjectInputs({});
      setShowBreakdownCalculator(false);
      setIsAdding(false);
    } catch (err) {
      console.error('Firestore mockExam save error:', err);
      setErrorMsg('Deneme sonucu Firestore mockExams koleksiyonuna kaydedilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExam = async (item: UnifiedExamItem) => {
    setErrorMsg(null);
    if (item.source === 'mockExams') {
      const prev = mockExams;
      setMockExams((curr) => curr.filter((e) => e.id !== item.id));
      try {
        await deleteMockExamFromFirestore(item.id);
      } catch (err) {
        console.error('Firestore mockExam delete error:', err);
        setMockExams(prev);
        setErrorMsg('Deneme kaydı silinemedi. Lütfen tekrar deneyin.');
      }
    } else {
      const prev = legacyExams;
      setLegacyExams((curr) => curr.filter((e) => e.id !== item.id));
      try {
        await deleteExamFromFirestore(item.id);
      } catch (err) {
        console.error('Firestore legacy exam delete error:', err);
        setLegacyExams(prev);
        setErrorMsg('Deneme kaydı silinemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  // Merge mockExams + any legacy exams sorted newest first
  const allExams: UnifiedExamItem[] = useMemo(() => {
    const mockItems: UnifiedExamItem[] = mockExams.map((m) => ({
      ...m,
      source: 'mockExams'
    }));
    const legacyItems: UnifiedExamItem[] = legacyExams.map(convertLegacyExam);

    return [...mockItems, ...legacyItems].sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (!Number.isNaN(diff) && diff !== 0) return diff;
      return b.createdAt - a.createdAt;
    });
  }, [mockExams, legacyExams]);

  // Metrics calculation for KPI Cards
  const stats = useMemo(() => {
    const tytValues = allExams
      .map((e) => e.tytNet)
      .filter((v): v is number => v !== null);
    const aytValues = allExams
      .map((e) => e.aytNet)
      .filter((v): v is number => v !== null);

    const latestTyt = tytValues.length > 0 ? tytValues[0].toFixed(2) : '0.00';
    const highestTyt = tytValues.length > 0 ? Math.max(...tytValues).toFixed(2) : '0.00';
    const avgTyt =
      tytValues.length > 0
        ? (tytValues.reduce((a, b) => a + b, 0) / tytValues.length).toFixed(2)
        : '0.00';

    const latestAyt = aytValues.length > 0 ? aytValues[0].toFixed(2) : '0.00';
    const highestAyt = aytValues.length > 0 ? Math.max(...aytValues).toFixed(2) : '0.00';
    const avgAyt =
      aytValues.length > 0
        ? (aytValues.reduce((a, b) => a + b, 0) / aytValues.length).toFixed(2)
        : '0.00';

    return {
      latestTyt,
      highestTyt,
      avgTyt,
      tytCount: tytValues.length,
      latestAyt,
      highestAyt,
      avgAyt,
      aytCount: aytValues.length
    };
  }, [allExams]);

  // Chronologically sorted data for dual-line Recharts LineChart
  const chartData: ChartDataPoint[] = useMemo(() => {
    const filtered = allExams.filter((item) => {
      if (chartFilter === 'tyt') return item.tytNet !== null;
      if (chartFilter === 'ayt') return item.aytNet !== null;
      return item.tytNet !== null || item.aytNet !== null;
    });

    return [...filtered]
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (!Number.isNaN(diff) && diff !== 0) return diff;
        return a.createdAt - b.createdAt;
      })
      .map((item) => {
        const shortName = item.name.length > 12 ? `${item.name.slice(0, 10)}..` : item.name;
        const shortDate = formatShortDate(item.date);
        return {
          xAxisLabel: shortDate ? `${shortDate} · ${shortName}` : shortName,
          fullName: item.name,
          date: item.date,
          publisher: item.publisher,
          tytNet: chartFilter === 'ayt' ? null : item.tytNet,
          aytNet: chartFilter === 'tyt' ? null : item.aytNet
        };
      });
  }, [allExams, chartFilter]);

  const showTytLine = chartFilter !== 'ayt';
  const showAytLine = chartFilter !== 'tyt';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-purple" />
            Deneme Netlerim
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            TYT ve AYT ({isTytOnly ? 'Genel' : aytField}) deneme sonuçlarını kaydet, gelişim trendini tek grafikten izle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding((prev) => !prev);
            setFormError(null);
          }}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purpleHover disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-purple/25 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Deneme Ekle</span>
        </button>
      </div>

      {/* Global Firestore Error Alert */}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Son TYT Neti
            </span>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {isLoading ? '...' : stats.latestTyt}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rekor: {stats.highestTyt} ({stats.tytCount} Deneme)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Son AYT Neti
            </span>
            <div className="text-2xl font-bold text-brand-purple dark:text-purple-400 mt-1">
              {isLoading ? '...' : stats.latestAyt}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rekor: {stats.highestAyt} ({stats.aytCount} Deneme)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purple dark:text-purple-400 border border-brand-purple/20">
            <Award className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Ortalama TYT / AYT
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {isLoading ? '...' : `${stats.avgTyt} / ${stats.avgAyt}`}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Genel Ortalama Net</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Toplam Deneme
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {isLoading ? '...' : `${allExams.length} Adet`}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Firestore mockExams Kaydı</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <LineChartIcon className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Dual-Line Recharts Visualization Card */}
      <Card className="p-5 sm:p-6 border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0f172a]/75">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-purple/10 text-brand-purple dark:text-brand-purpleLight border border-brand-purple/20 shrink-0">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                TYT &amp; AYT Deneme Netleri Gelişim Grafiği
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Denemelerin tarih ve adlarına göre TYT (mavi) ile AYT (mor) net karşılaştırması
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {/* Series Legend */}
            <div className="flex items-center gap-3 text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              {showTytLine && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-sky-400" />
                  TYT Neti
                </span>
              )}
              {showAytLine && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-brand-purple dark:text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-purple dark:bg-purple-400" />
                  AYT Neti
                </span>
              )}
            </div>

            {/* Filter Switcher */}
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  chartFilter === 'all'
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                TYT + AYT
              </button>
              <button
                type="button"
                onClick={() => setChartFilter('tyt')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  chartFilter === 'tyt'
                    ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                TYT
              </button>
              <button
                type="button"
                onClick={() => setChartFilter('ayt')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  chartFilter === 'ayt'
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                AYT
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-brand-purple dark:text-brand-purpleLight animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Deneme grafiği Firestore&apos;dan yükleniyor...
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center px-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/30">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 border border-brand-purple/25 flex items-center justify-center mb-3 text-brand-purple dark:text-brand-purpleLight">
              <LineChartIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-md leading-relaxed">
              Henüz gösterilecek deneme neti verisi yok. &quot;Yeni Deneme Ekle&quot; butonuna basarak TYT ve AYT netlerini grafikte izlemeye başla!
            </p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 14, right: 18, left: -12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />

                <XAxis
                  dataKey="xAxisLabel"
                  stroke={chartAxisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: chartAxisLineStroke }}
                  dy={10}
                />

                <YAxis
                  stroke={chartAxisStroke}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: chartAxisLineStroke }}
                  domain={[0, (dataMax: number) => Math.max(40, Math.ceil(dataMax + 10))]}
                  dx={-4}
                />

                <Tooltip content={<CustomChartTooltip />} />

                {showTytLine && (
                  <Line
                    type="monotone"
                    dataKey="tytNet"
                    name="TYT Neti"
                    stroke={tytLineColor}
                    strokeWidth={3}
                    connectNulls
                    dot={{
                      r: 4.5,
                      fill: chartDotFill,
                      stroke: tytLineColor,
                      strokeWidth: 2.5
                    }}
                    activeDot={{
                      r: 7,
                      fill: tytLineColor,
                      stroke: isDark ? '#FFFFFF' : '#0F172A',
                      strokeWidth: 2
                    }}
                  />
                )}

                {showAytLine && (
                  <Line
                    type="monotone"
                    dataKey="aytNet"
                    name="AYT Neti"
                    stroke={aytLineColor}
                    strokeWidth={3}
                    connectNulls
                    dot={{
                      r: 4.5,
                      fill: chartDotFill,
                      stroke: aytLineColor,
                      strokeWidth: 2.5
                    }}
                    activeDot={{
                      r: 7,
                      fill: aytLineColor,
                      stroke: isDark ? '#FFFFFF' : '#0F172A',
                      strokeWidth: 2
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Add New Mock Exam Collapsible Form */}
      {isAdding && (
        <Card className="p-6 border-brand-purple/40 bg-white dark:bg-slate-900/90 shadow-glow-purple/10 dark:shadow-glow-purple/20 animate-fadeIn">
          <form onSubmit={handleAddMockExam} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
                Yeni Deneme Sonucu Ekle (mockExams)
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Kapat
              </button>
            </div>

            {/* Meta Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Deneme Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ör. 3D Türkiye Geneli 3"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Tarih *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-purple transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Yayın / Kurum
                </label>
                <input
                  type="text"
                  placeholder="ör. Özdebir, 3D, Bilgi Sarmal"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple transition"
                />
              </div>
            </div>

            {/* Direct TYT & AYT Net Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/25">
                <label
                  htmlFor="mock-tyt-net"
                  className="flex items-center justify-between text-xs font-semibold text-sky-700 dark:text-sky-300 mb-1.5"
                >
                  <span>TYT Toplam Neti</span>
                  <span className="text-[11px] font-normal text-sky-600/80 dark:text-sky-400/80">
                    Maks 120
                  </span>
                </label>
                <input
                  id="mock-tyt-net"
                  type="number"
                  step="0.25"
                  min="0"
                  max="120"
                  placeholder="ör. 84.50"
                  value={tytNetInput}
                  onChange={(e) => {
                    setTytNetInput(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-sky-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-brand-purple/10 border border-purple-200 dark:border-brand-purple/25">
                <label
                  htmlFor="mock-ayt-net"
                  className="flex items-center justify-between text-xs font-semibold text-brand-purple dark:text-purple-300 mb-1.5"
                >
                  <span>AYT Toplam Neti ({isTytOnly ? 'İsteğe bağlı' : aytField})</span>
                  <span className="text-[11px] font-normal text-brand-purple/80 dark:text-purple-400/80">
                    Maks 80
                  </span>
                </label>
                <input
                  id="mock-ayt-net"
                  type="number"
                  step="0.25"
                  min="0"
                  max="80"
                  placeholder="ör. 56.25"
                  value={aytNetInput}
                  onChange={(e) => {
                    setAytNetInput(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-purple-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-purple transition"
                />
              </div>
            </div>

            {/* Optional Subject Breakdown Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowBreakdownCalculator((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-purple dark:text-brand-purpleLight hover:underline"
              >
                {showBreakdownCalculator ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>Ders Bazlı Netlerden Otomatik Hesapla (Opsiyonel)</span>
              </button>

              {showBreakdownCalculator && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <div>
                    <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 mb-2">
                      TYT Ders Netleri:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TYT_FIELDS.map((field) => (
                        <div
                          key={field.key}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                            {field.label} (Max {field.max})
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max={field.max}
                            placeholder="0.00"
                            value={tytSubjectInputs[field.key] ?? ''}
                            onChange={(e) => handleTytSubjectChange(field.key, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-brand-purple dark:text-purple-400 mb-2">
                      AYT ({aytField}) Ders Netleri:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activeAytFields.map((field) => (
                        <div
                          key={field.key}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                            {field.label} (Max {field.max})
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max={field.max}
                            placeholder="0.00"
                            value={aytSubjectInputs[field.key] ?? ''}
                            onChange={(e) => handleAytSubjectChange(field.key, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand-purple"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-purple hover:bg-brand-purpleHover disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-brand-purple/20"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Kaydediliyor...' : 'Sonucu Kaydet'}</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Past Exam Records List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Geçmiş Deneme Sonuçları ({allExams.length})
          </span>
        </div>

        {isLoading ? (
          <Card className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-7 h-7 text-brand-purple dark:text-brand-purpleLight animate-spin mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Kayıtlar yükleniyor...</p>
          </Card>
        ) : allExams.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-slate-300 dark:border-slate-800">
            <BarChart3 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Henüz deneme sonucu girilmedi
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              &quot;Yeni Deneme Ekle&quot; butonuna basarak TYT ve AYT netlerini kaydedebilir, grafikte karşılaştırabilirsin.
            </p>
          </Card>
        ) : (
          allExams.map((exam) => (
            <Card
              key={`${exam.source}-${exam.id}`}
              className="p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                      {exam.name}
                    </h3>
                    {exam.tytNet !== null && <Badge variant="midnight">TYT</Badge>}
                    {exam.aytNet !== null && (
                      <Badge variant="purple">
                        AYT{exam.field ? ` · ${exam.field}` : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {exam.date}
                    </span>
                    {exam.publisher && (
                      <>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span>{exam.publisher}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  {exam.tytNet !== null && (
                    <div className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 text-center min-w-[92px]">
                      <span className="text-[10px] text-sky-700 dark:text-sky-300 block font-semibold uppercase">
                        TYT Net
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {exam.tytNet.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {exam.aytNet !== null && (
                    <div className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-brand-purple/20 border border-purple-200 dark:border-brand-purple/35 text-center min-w-[92px]">
                      <span className="text-[10px] text-brand-purple dark:text-purple-300 block font-semibold uppercase">
                        AYT Net
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {exam.aytNet.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteExam(exam)}
                    className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                    title="Denemeyi Sil"
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
