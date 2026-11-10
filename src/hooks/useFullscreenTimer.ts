import { useState, useRef, useEffect, useCallback } from 'react';

interface FullscreenElement extends HTMLDivElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

const CONTROL_HIDE_DELAY_MS = 2600;

export const useFullscreenTimer = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  const clearHideTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }, []);

  const revealControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    clearHideTimer();
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROL_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current as FullscreenElement | null;
    if (el) {
      try {
        if (typeof el.requestFullscreen === 'function') {
          await el.requestFullscreen();
        } else if (typeof el.webkitRequestFullscreen === 'function') {
          await el.webkitRequestFullscreen();
        }
      } catch {
        // Fallback: overlay fullscreen UI inside viewport even if native API rejects
      }
    }

    setIsFullscreen(true);
    revealControlsTemporarily();
  }, [revealControlsTemporarily]);

  const exitFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument;
    try {
      if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') {
        await doc.exitFullscreen();
      } else if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === 'function') {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // Ignore exit errors
    }

    clearHideTimer();
    setIsFullscreen(false);
    setControlsVisible(true);
  }, [clearHideTimer]);

  // Sync with browser native fullscreen exit (e.g. ESC pressed while native fullscreen is active)
  useEffect(() => {
    const doc = document as FullscreenDocument;

    const handleFullscreenChange = () => {
      const nativeActive = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(nativeActive);
      if (nativeActive) {
        revealControlsTemporarily();
      } else {
        clearHideTimer();
        setControlsVisible(true);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      clearHideTimer();
    };
  }, [clearHideTimer, exitFullscreen, revealControlsTemporarily]);

  return {
    containerRef,
    isFullscreen,
    controlsVisible,
    enterFullscreen,
    exitFullscreen,
    handleActivity: revealControlsTemporarily,
    keepControlsVisible: clearHideTimer
  };
};
