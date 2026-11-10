import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  CheckSquare, 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Clock,
  Timer,
  Sparkles,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, onboardingProfile, isTytOnly } = useAuth();
  const displayUsername = user?.username || 'Öğrenci';
  const targetUniversity = onboardingProfile?.targetUniversity || 'Hedef Üniversite';
  const targetDepartment = onboardingProfile?.targetDepartment || 'Hedef Bölüm';
  const gradeLevel = onboardingProfile?.gradeLevel || '12. Sınıf';
  const studyField = onboardingProfile?.studyField || 'Sayısal';

  const getDailySnapshotTasks = () => {
    if (isTytOnly) {
      return [
        {
          subject: 'Matematik (TYT)',
          topic: 'Problemler & Sayı-Kesir Hız Çalışması',
          status: true,
          duration: '60 dk',
        },
        {
          subject: 'Türkçe (TYT)',
          topic: 'Paragrafta Yapı & Anlatım Teknikleri (2 Deneme)',
          status: true,
          duration: '50 dk',
        },
        {
          subject: 'Fizik (TYT)',
          topic: 'Optik ve Dalgalar Temel Kavram Tekrarı',
          status: true,
          duration: '40 dk',
        },
        {
          subject: 'Coğrafya (TYT)',
          topic: 'Harita Bilgisi ve İklim Tipleri Soru Çözümü',
          status: false,
          duration: '35 dk',
        },
        {
          subject: 'Biyoloji (TYT)',
          topic: 'Hücre Bölünmeleri ve Kalıtım Özeti',
          status: false,
          duration: '40 dk',
        },
      ];
    }

    if (studyField === 'Eşit Ağırlık') {
      return [
        {
          subject: 'Matematik (AYT)',
          topic: 'Türev Uygulamaları & Maksimum-Minimum Problemleri',
          status: true,
          duration: '60 dk',
        },
        {
          subject: 'Edebiyat (AYT)',
          topic: 'Cumhuriyet Dönemi Şiir ve Roman Analizi',
          status: true,
          duration: '45 dk',
        },
        {
          subject: 'Türkçe (TYT)',
          topic: 'Paragrafta Yapı & Anlatım Teknikleri (2 Deneme)',
          status: true,
          duration: '50 dk',
        },
        {
          subject: 'Sosyal-1 (AYT)',
          topic: 'Kurtuluş Savaşı Muharebeler Dönemi Tekrarı',
          status: false,
          duration: '40 dk',
        },
        {
          subject: 'Matematik (TYT)',
          topic: 'Üslü ve Köklü İfadeler Karma Test',
          status: false,
          duration: '45 dk',
        },
      ];
    }

    if (studyField === 'Sözel') {
      return [
        {
          subject: 'Edebiyat (AYT)',
          topic: 'Divan Edebiyatı Nazım Biçimleri & Şairler',
          status: true,
          duration: '50 dk',
        },
        {
          subject: 'Sosyal-1 (AYT)',
          topic: 'Osmanlı Kültür ve Medeniyeti Konu Özeti',
          status: true,
          duration: '45 dk',
        },
        {
          subject: 'Türkçe (TYT)',
          topic: 'Paragraf Denemesi & Dil Bilgisi Tekrarı',
          status: true,
          duration: '45 dk',
        },
        {
          subject: 'Sosyal-2 (AYT)',
          topic: 'Felsefe Tarihi & Mantık Çıkmış Sorular',
          status: false,
          duration: '40 dk',
        },
        {
          subject: 'Coğrafya (TYT)',
          topic: 'Türkiye Fiziki Coğrafyası Harita Çalışması',
          status: false,
          duration: '35 dk',
        },
      ];
    }

    if (studyField === 'Dil') {
      return [
        {
          subject: 'Yabancı Dil (YDT)',
          topic: 'Reading Comprehension & Cloze Test Pratiği',
          status: true,
          duration: '60 dk',
        },
        {
          subject: 'Yabancı Dil (YDT)',
          topic: 'Academic Vocabulary & Phrasal Verbs Tekrarı',
          status: true,
          duration: '45 dk',
        },
        {
          subject: 'Türkçe (TYT)',
          topic: 'Paragrafta Anlam & Cümlede Anlam (30 Soru)',
          status: true,
          duration: '40 dk',
        },
        {
          subject: 'Yabancı Dil (YDT)',
          topic: 'Grammar: Modals & Conditionals Karma Test',
          status: false,
          duration: '45 dk',
        },
        {
          subject: 'Matematik (TYT)',
          topic: 'Temel Kavramlar & Sayı Problemleri',
          status: false,
          duration: '45 dk',
        },
      ];
    }

    // Default: Sayısal (11, 12, Mezun)
    return [
      {
        subject: 'Matematik (AYT)',
        topic: 'Türev Uygulamaları & Maksimum-Minimum Problemleri',
        status: true,
        duration: '60 dk',
      },
      {
        subject: 'Fizik (AYT)',
        topic: 'Elektriksel Potansiyel ve İş Soru Çözümü',
        status: true,
        duration: '45 dk',
      },
      {
        subject: 'Türkçe (TYT)',
        topic: 'Paragrafta Yapı & Anlatım Teknikleri (2 Deneme)',
        status: true,
        duration: '50 dk',
      },
      {
        subject: 'Biyoloji (AYT)',
        topic: 'Fotosentez ve Kemosentez Reaksiyonları Tekrarı',
        status: false,
        duration: '40 dk',
      },
      {
        subject: 'Kimya (AYT)',
        topic: 'Sulu Çözeltilerde Denge & pH Hesaplamaları',
        status: false,
        duration: '50 dk',
      },
    ];
  };

  const getCoachInsight = () => {
    if (isTytOnly) {
      return `${gradeLevel} sürecinde düzenli TYT paragraf ve problem pratiği yapman, ileriki sınıflar için güçlü bir temel oluşturacaktır. Konu eksiklerini erken kapatmaya devam et!`;
    }
    if (studyField === 'Eşit Ağırlık') {
      return 'Eşit Ağırlık sıralamasında fark yaratmak için AYT Matematik netlerini korurken Edebiyat ve Sosyal-1 ezber tekrarlarını haftalık periyotlara yayman çok önemli.';
    }
    if (studyField === 'Sözel') {
      return 'Edebiyat, Sosyal-1 ve Sosyal-2 branşlarında bilgi tutarlılığını artırmak için görsel özet kartlarıyla haftalık tekrarlar yapman netlerini hızla yukarı taşıyacaktır.';
    }
    if (studyField === 'Dil') {
      return 'YDT okuma hızını ve kelime dağarcığını geliştirirken TYT Türkçe ve Matematik netlerini yüksek tutmak seni hedeflediğin bölüme bir adım daha yaklaştıracaktır.';
    }
    return 'Matematik branş denemelerinde süre yönetimin güçlendi. Fen kısmında özellikle Kimya ve Fizik konularına odaklanman netini 4-5 puan daha yukarı taşıyacaktır.';
  };

  const snapshotTasks = getDailySnapshotTasks();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Motivasyon Köşesi & Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#141b2e] via-[#1a1c3d] to-[#12182b] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-purple/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-5">
          {/* Top Motivation Corner */}
          <div className="pb-5 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/15 text-brand-purpleLight text-xs font-semibold border border-brand-purple/30">
                <Target className="w-3.5 h-3.5" />
                <span>Motivasyon Köşesi · {gradeLevel} ({studyField})</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-brand-purpleLight">
                Hedef: {targetUniversity} - {targetDepartment}
              </h1>
            </div>

            <Link
              to="/onboarding?edit=1"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-brand-purpleLight bg-slate-900/70 hover:bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition self-start lg:self-auto shrink-0"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Hedefi Düzenle</span>
            </Link>
          </div>

          {/* Welcome Subtitle & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-white">
                <Sparkles className="w-4 h-4 text-brand-purpleLight" />
                <span>Hoş Geldin, {displayUsername}! 👋</span>
              </div>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Bugün hedefine ulaşmak için harika bir gün. Günlük çalışma programındaki konuları tamamla ve {isTytOnly ? 'TYT' : 'TYT/AYT'} deneme netlerini düzenli kaydederek gelişimini izle.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/program"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white text-sm font-semibold shadow-lg shadow-brand-purple/25 transition-all duration-200"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Bugünkü Programa Git</span>
              </Link>
              <Link
                to="/denemeler"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Net Girişi</span>
              </Link>
              <Link
                to="/sayac"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-sm font-semibold border border-slate-700 hover:border-slate-600 transition-all duration-200"
              >
                <Timer className="w-4 h-4" />
                <span>Çalışma Sayacı</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isTytOnly ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        {/* Metric 1 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Günlük İlerleme</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-brand-purpleLight border border-purple-500/20">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-white">4 / 6</span>
              <span className="text-xs font-semibold text-brand-purpleLight">%66</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-brand-purple h-full rounded-full w-2/3" />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Tamamlanan görevler</p>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Son TYT Neti</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-2xl font-bold text-white">92.75</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                +4.5 net
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Hedef: 105.00</span>
              <span className="text-slate-400 font-medium">3D Simülasyon</span>
            </div>
          </div>
        </Card>

        {/* Metric 3: AYT Net (Only shown if NOT TYT-only) */}
        {!isTytOnly && (
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">Son AYT Neti</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-2xl font-bold text-white">64.50</span>
                <span className="text-xs font-medium text-emerald-400 flex items-center">
                  +2.25 net
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Hedef: 75.00</span>
                <span className="text-slate-400 font-medium">{studyField} Alanı</span>
              </div>
            </div>
          </Card>
        )}

        {/* Metric 4 */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Çalışma Serisi</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-2xl font-bold text-white">14 Gün</span>
              <Badge variant="amber">Aralıksız</Badge>
            </div>
            <p className="text-[11px] text-slate-500">Bu hafta toplam: 38 saat</p>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Daily tasks preview & Recent exam snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Tasks Snapshot */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-purple" />
              <h2 className="text-lg font-semibold text-white">Bugünün Çalışma Listesi</h2>
            </div>
            <Link 
              to="/program"
              className="text-xs font-medium text-brand-purpleLight hover:text-white flex items-center gap-1 transition"
            >
              <span>Tümünü Gör</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="p-0 divide-y divide-slate-800/80 overflow-hidden">
            {snapshotTasks.map((task, idx) => (
              <div 
                key={idx}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                    task.status 
                      ? 'bg-brand-purple border-brand-purple text-white' 
                      : 'border-slate-700 bg-slate-900/50'
                  }`}>
                    {task.status && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      task.status ? 'text-slate-400 line-through' : 'text-slate-200'
                    }`}>
                      {task.topic}
                    </p>
                    <span className="text-xs text-brand-purpleLight/80">{task.subject}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {task.duration}
                  </span>
                  <Badge variant={task.status ? 'emerald' : 'slate'}>
                    {task.status ? 'Bitti' : 'Kaldı'}
                  </Badge>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right 1 Col: Quick Coaching & Target Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold text-white">Hedef & Koçluk Durumu</h2>
          </div>

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs text-slate-400">Program Modu</span>
              <span className="text-sm font-bold text-brand-purpleLight">
                {gradeLevel} · {studyField}
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">TYT Net Hedefi</span>
                  <span className="text-white font-medium">92.75 / 105.00</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              {!isTytOnly && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">AYT ({studyField}) Net Hedefi</span>
                    <span className="text-white font-medium">64.50 / 75.00</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-brand-purple to-purple-400 h-full rounded-full" style={{ width: '86%' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Coach Insight */}
            <div className="pt-2">
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-purpleLight">
                  <Target className="w-3.5 h-3.5" />
                  <span>Koçun Haftalık Analizi</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {getCoachInsight()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
