import React from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePwaInstall } from '../../context/PwaContext';

interface PwaInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({ variant = 'header' }) => {
  const { canShowInstallUi, isInstalling, triggerInstall } = usePwaInstall();

  if (!canShowInstallUi) {
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={() => void triggerInstall()}
        disabled={isInstalling}
        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-brand-purpleDark dark:text-white bg-purple-50 dark:bg-gradient-to-r dark:from-brand-purple/25 dark:to-indigo-600/25 hover:bg-purple-100 dark:hover:from-brand-purple/35 dark:hover:to-indigo-600/35 border border-purple-200 dark:border-brand-purple/40 disabled:opacity-60 transition-all duration-200"
      >
        <Smartphone className="w-4 h-4 text-brand-purple dark:text-brand-purpleLight" />
        <span>Ana Ekrana Ekle</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void triggerInstall()}
      disabled={isInstalling}
      title="Uygulamayı Cihaza Kur"
      aria-label="Ana Ekrana Ekle"
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purpleHover hover:to-indigo-500 shadow-md shadow-brand-purple/20 disabled:opacity-60 transition-all duration-200"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">Ana Ekrana Ekle</span>
      <span className="lg:hidden">Yükle</span>
    </button>
  );
};

export const PwaIosGuideModal: React.FC = () => {
  const { showIosGuide, closeIosGuide } = usePwaInstall();

  if (!showIosGuide) {
    return null;
  }

  return (
    <div
      onClick={closeIosGuide}
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/15 border border-brand-purple/30 flex items-center justify-center text-brand-purple dark:text-brand-purpleLight shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ana Ekrana Ekle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                iOS Safari Kurulum Adımları
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeIosGuide}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span>
              Safari alt çubuğundaki{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                <Share className="w-3.5 h-3.5 text-brand-purple" /> Paylaş
              </span>{' '}
              butonuna dokunun.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand-purple/15 text-brand-purple dark:text-brand-purpleLight font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span>
              Açılan menüden{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                <PlusSquare className="w-3.5 h-3.5 text-brand-purple" /> Ana Ekrana Ekle
              </span>{' '}
              seçeneğine dokunun.
            </span>
          </li>
        </ol>

        <button
          type="button"
          onClick={closeIosGuide}
          className="w-full py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white text-xs font-semibold transition"
        >
          Anladım
        </button>
      </div>
    </div>
  );
};
