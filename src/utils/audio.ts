/**
 * Plays a gentle two-note harmonic bell chime using the Web Audio API.
 */
export const playTimerChime = (enabled: boolean): void => {
  if (!enabled) return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.22);

    gainNode.gain.setValueAtTime(0.28, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.15);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.15);
  } catch {
    // Web Audio API may be blocked until user interaction
  }
};
