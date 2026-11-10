import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextValue {
  isInstalled: boolean;
  canPromptInstall: boolean;
  isIos: boolean;
  canShowInstallUi: boolean;
  isInstalling: boolean;
  showIosGuide: boolean;
  triggerInstall: () => Promise<void>;
  closeIosGuide: () => void;
}

const PwaContext = createContext<PwaContextValue | undefined>(undefined);

const detectStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  );
  return mediaStandalone || iosStandalone;
};

const detectIosDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
};

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(detectStandaloneMode);
  const [isIos] = useState<boolean>(detectIosDevice);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    if (isIos && !isInstalled) {
      setShowIosGuide(true);
    }
  }, [deferredPrompt, isIos, isInstalled]);

  const closeIosGuide = useCallback(() => {
    setShowIosGuide(false);
  }, []);

  const canPromptInstall = Boolean(deferredPrompt);
  const canShowInstallUi = !isInstalled && (canPromptInstall || isIos);

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canPromptInstall,
        isIos,
        canShowInstallUi,
        isInstalling,
        showIosGuide,
        triggerInstall,
        closeIosGuide
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwaInstall = (): PwaContextValue => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwaInstall must be used within a PwaProvider');
  }
  return context;
};
