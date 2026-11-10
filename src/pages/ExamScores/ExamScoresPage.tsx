import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  LineChart as LineChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  STORAGE_PREFIXES,
  getLocalDateKey,
  getUserStorageKey,
  readLocalStorageJson,
  writeLocalStorageJson
} from '../../utils/storage';
import type { StudyField, TrialExam } from '../../types';

interface ScoreFieldConfig {
  key: keyof Omit<TrialExam['scores'], 'total'>;
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

interface ChartDataPoint {
  name: string;
  fullName: string;
  date: string;
  total: number;
  breakdown: Array<{ label: string; value: number }>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl bg-[#090D16]/95 backdrop-blur-md border border-slate-700/80 p-4 shadow-2xl text-xs space-y-2 min-w-[190px]">
        <div className="border-b border-slate-800 pb-1.5">
          <p className="font-semibold text-white tracking-tight">{data.fullName}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brand-purpleLight" />
            {data.date}
          </p>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-slate-300 font-medium">Toplam Net:</span>
          <span className="text-base font-bold text-brand-purpleLight">
            {data.total} Net
          </span>
        </div>

        {data.breakdown.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
            {data.breakdown.map((item) => (
              <div key={item.label}>
                {item.label}: <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ExamScoresPage: React.FC = () => {
  const { user, onboardingProfile, isTytOnly } = useAuth();
  const studyField = onboardingProfile?.studyField ?? 'Sayısal';
  const aytField: Exclude<StudyField, 'Sadece TYT'> =
    studyField === 'Sadece TYT' ? 'Sayısal' : studyField;

  const storageKey = getUserStorageKey(STORAGE_PREFIXES.EXAMS, user?.id);

  // Start with empty array []; load from localStorage in useEffect
  const [exams, setExams] = useState<TrialExam[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'TYT' | 'AYT'>('TYT');
  const [isAdding, setIsAdding] = useState(false);

  // New Exam Form Fields
  const [name, setName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [date, setDate] = useState(() => getLocalDateKey());
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});

  // Load saved exams from localStorage on mount / user change
  useEffect(() => {
    const stored = readLocalStorageJson<TrialExam[]>(storageKey, []);
    setExams(Array.isArray(stored) ? stored : []);
    setLoadedKey(storageKey);
  }, [storageKey]);

  // Save exams to localStorage whenever state updates after initial load
  useEffect(() => {
    if (loadedKey === storageKey) {
      writeLocalStorageJson(storageKey, exams);
    }
  }, [exams, storageKey, loadedKey]);

  // Enforce TYT-only mode if user is 9/10 grade or Sadece TYT
  useEffect(() => {
    if (isTytOnly && activeTab !== 'TYT') {
      setActiveTab('TYT');
    }
  }, [isTytOnly, activeTab]);

  // Reset form score inputs whenever tab or study field changes
  useEffect(() => {
    setScoreInputs({});
  }, [activeTab, studyField]);

  // Determine active form fields based on TYT vs AYT + Study Field
  const activeScoreFields: ScoreFieldConfig[] = useMemo(() => {
    if (activeTab === 'TYT') {
      return TYT_FIELDS;
    }
    return AYT_FIELDS_BY_STUDY_FIELD[aytField];
  }, [activeTab, aytField]);

  // Filter exams shown in current tab
  const currentTabExams = useMemo(() => {
    if (activeTab === 'TYT') {
      return exams.filter((e) => e.examType === 'TYT');
    }
    if (isTytOnly) {
      return [];
    }
    return exams.filter(
      (e) => e.examType === 'AYT' && (!e.field || e.field === aytField)
    );
  }, [exams, activeTab, isTytOnly, aytField]);

  // Calculate preview total from currently active field inputs
  const previewTotal = useMemo(() => {
    const sum = activeScoreFields.reduce((acc, field) => {
      const val = parseFloat(scoreInputs[field.key] ?? '') || 0;
      return acc + val;
    }, 0);
    return parseFloat(sum.toFixed(2));
  }, [activeScoreFields, scoreInputs]);

  const handleScoreInputChange = (key: string, value: string) => {
    setScoreInputs((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const scoresObj: TrialExam['scores'] = { total: previewTotal };
    activeScoreFields.forEach((field) => {
      const val = parseFloat(scoreInputs[field.key] ?? '') || 0;
      scoresObj[field.key] = val;
    });

    const newExam: TrialExam = {
      id: Date.now().toString(),
      examType: isTytOnly ? 'TYT' : activeTab,
      field: !isTytOnly && activeTab === 'AYT' ? aytField : undefined,
      name: name.trim(),
      publisher: publisher.trim() || undefined,
      date,
      scores: scoresObj
    };

    setExams((prev) => [newExam, ...prev]);
    setName('');
    setPublisher('');
    setScoreInputs({});
    setIsAdding(false);
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  // Metrics calculation
  const totalScores = currentTabExams.map((e) => e.scores.total);
  const highestNet = totalScores.length > 0 ? Math.max(...totalScores).toFixed(2) : '0.00';
  const averageNet =
    totalScores.length > 0
      ? (totalScores.reduce((a, b) => a + b, 0) / totalScores.length).toFixed(2)
      : '0.00';
  const latestNet =
    currentTabExams.length > 0 ? currentTabExams[0].scores.total.toFixed(2) : '0.00';

  // Helper to get field breakdown badges for any TrialExam
  const getExamBreakdown = (exam: TrialExam): Array<{ label: string; value: number }> => {
    const fields =
      exam.examType === 'TYT'
        ? TYT_FIELDS
        : AYT_FIELDS_BY_STUDY_FIELD[
            exam.field && exam.field !== 'Sadece TYT' ? exam.field : aytField
          ];

    return fields.map((f) => ({
      label: f.shortLabel,
      value: exam.scores[f.key] ?? 0
    }));
  };

  // Chronologically sorted data for the Line Chart
  const chartData: ChartDataPoint[] = [...currentTabExams]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((exam) => ({
      name: exam.name.length > 14 ? exam.name.slice(0, 12) + '..' : exam.name,
      fullName: exam.name,
      date: exam.date,
      total: exam.scores.total,
      breakdown: getExamBreakdown(exam)
    }));

  const netGrowth =
    chartData.length > 1
      ? (chartData[chartData.length - 1].total - chartData[0].total).toFixed(2)
      : '0.00';
  const isPositiveGrowth = parseFloat(netGrowth) >= 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-purple" />
            Deneme Netlerim
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isTytOnly
              ? 'TYT deneme sonuçlarını kaydet, ders bazında gelişimini ve net analizini izle.'
              : `TYT ve AYT (${aytField}) deneme sonuçlarını kaydet, ders bazında gelişimini ve net analizini izle.`}
          </p>
        </div>

        {/* Tab Selection + New Exam Button */}
        <div className="flex items-center gap-3">
          {isTytOnly ? (
            <div className="px-4 py-2 rounded-xl bg-brand-purple/15 border border-brand-purple/30 text-brand-purpleLight text-xs font-semibold">
              TYT Denemeleri
            </div>
          ) : (
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center">
              <button
                onClick={() => setActiveTab('TYT')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'TYT'
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                TYT Denemeleri
              </button>
              <button
                onClick={() => setActiveTab('AYT')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'AYT'
                    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AYT ({aytField})
              </button>
            </div>
          )}

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white text-xs font-semibold shadow-lg shadow-brand-purple/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Deneme Ekle</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Son Girilen Net</span>
            <div className="text-2xl font-bold text-white mt-1">{latestNet}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{activeTab} Sonuç</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purpleLight border border-brand-purple/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Ortalama Net</span>
            <div className="text-2xl font-bold text-white mt-1">{averageNet}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currentTabExams.length} Deneme Ortalaması
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">En Yüksek Net (Rekor)</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{highestNet}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Kişisel Rekor</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Sleek Line Chart for Net Progress */}
      <Card className="p-6 border-slate-800/90 bg-[#0f172a]/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purpleLight border border-brand-purple/20">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {activeTab === 'AYT' ? `AYT (${aytField})` : 'TYT'} Net Artış ve Gelişim Trendi
              </h2>
              <p className="text-xs text-slate-400">
                Kronolojik olarak kaydedilen denemelerin net seyri
              </p>
            </div>
          </div>

          {chartData.length > 1 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-400">Net Gelişimi:</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  isPositiveGrowth
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {isPositiveGrowth ? `+${netGrowth}` : netGrowth} Net
              </span>
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 border border-brand-purple/25 flex items-center justify-center mb-3 text-brand-purpleLight">
              <LineChartIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300 max-w-md leading-relaxed">
              Henüz deneme verisi girmedin. İlk denemeni ekleyerek yükselişini izle.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="purpleGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                  dy={10}
                />

                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                  domain={[
                    (dataMin: number) => Math.max(0, Math.floor(dataMin - 5)),
                    (dataMax: number) => Math.ceil(dataMax + 5)
                  ]}
                  dx={-5}
                />

                <Tooltip content={<CustomChartTooltip />} />

                {parseFloat(averageNet) > 0 && (
                  <ReferenceLine
                    y={parseFloat(averageNet)}
                    stroke="#3B82F6"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="total"
                  name="Toplam Net"
                  stroke="url(#purpleGlow)"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#090D16',
                    stroke: '#A855F7',
                    strokeWidth: 2
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#8B5CF6',
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                    className: 'filter drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Add New Exam Collapsible Form */}
      {isAdding && (
        <Card className="p-6 border-brand-purple/40 bg-slate-900/90 shadow-glow-purple/20">
          <form onSubmit={handleAddExam} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-purpleLight" />
                Yeni {activeTab === 'AYT' ? `AYT (${aytField})` : 'TYT'} Deneme Sonucu Kaydet
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Kapat
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Deneme Adı / Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ör. 3D Türkiye Geneli Deneme 2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Yayın / Kurum
                </label>
                <input
                  type="text"
                  placeholder="ör. 3D, Özdebir, Bilgi Sarmal"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Tarih
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition"
                />
              </div>
            </div>

            {/* Dynamically Filtered Subject Net Inputs */}
            <div className="pt-2">
              <div className="text-xs font-medium text-slate-300 mb-2">
                Ders Netleri ({activeTab === 'AYT' ? `${aytField} Alanı` : 'TYT'}):
              </div>
              <div
                className={`grid gap-3 ${
                  activeScoreFields.length === 1
                    ? 'grid-cols-1 sm:max-w-xs'
                    : activeScoreFields.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : activeScoreFields.length === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-4'
                }`}
              >
                {activeScoreFields.map((field) => (
                  <div
                    key={field.key}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800"
                  >
                    <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max={field.max}
                      placeholder="0.00"
                      value={scoreInputs[field.key] ?? ''}
                      onChange={(e) => handleScoreInputChange(field.key, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-brand-purple"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Max {field.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Net preview & submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Hesaplanan Toplam Net:</span>
                <span className="text-xl font-bold text-brand-purpleLight">
                  {previewTotal} Net
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-purple hover:bg-brand-purpleHover text-white text-xs font-semibold rounded-xl transition shadow-md shadow-brand-purple/20"
                >
                  Sonucu Kaydet
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Past Exam Records List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Geçmiş {activeTab === 'AYT' ? `AYT (${aytField})` : 'TYT'} Deneme Kayıtları ({currentTabExams.length})
          </span>
        </div>

        {currentTabExams.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-slate-800">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">
              Henüz {activeTab} denemesi girilmedi
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              "Deneme Ekle" butonuna basarak ilk deneme netini kaydedebilirsin.
            </p>
          </Card>
        ) : (
          currentTabExams.map((exam) => {
            const breakdown = getExamBreakdown(exam);
            return (
              <Card
                key={exam.id}
                className="p-5 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Exam Title & Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-white tracking-tight">
                        {exam.name}
                      </h3>
                      <Badge variant={exam.examType === 'TYT' ? 'midnight' : 'purple'}>
                        {exam.examType}
                        {exam.field ? ` · ${exam.field}` : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {exam.date}
                      </span>
                      {exam.publisher && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span>{exam.publisher}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Subject Net Badges */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {breakdown.map((item) => (
                      <div
                        key={item.label}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[54px]"
                      >
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-white">{item.value}</span>
                      </div>
                    ))}

                    {/* Total Net Card */}
                    <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-purple/20 to-indigo-600/20 border border-brand-purple/40 text-center min-w-[90px]">
                      <span className="text-[10px] text-brand-purpleLight block font-semibold uppercase">
                        Toplam Net
                      </span>
                      <span className="text-base font-extrabold text-white">
                        {exam.scores.total}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Denemeyi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
