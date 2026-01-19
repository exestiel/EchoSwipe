import { useCallback, useRef } from 'react';

/**
 * useAudioFeedback hook for playing audio feedback sounds
 * Uses Web Audio API to generate tones
 */
export function useAudioFeedback() {
  const audioContextRef = useRef(null);

  // Initialize audio context lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not available:', error);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  // Play a tone with specified frequency, duration, and type
  const playTone = useCallback(
    (frequency, duration, type = 'sine') => {
      const audioContext = getAudioContext();
      if (!audioContext) return;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        // Envelope: fade in and out for smoother sound
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick fade in
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Fade out

        oscillator.start(now);
        oscillator.stop(now + duration);
      } catch (error) {
        console.warn('Error playing tone:', error);
      }
    },
    [getAudioContext]
  );

  // Play success sound (pleasant high tone)
  const playSuccess = useCallback(() => {
    playTone(800, 0.15, 'sine');
    setTimeout(() => playTone(1000, 0.1, 'sine'), 50); // Quick second tone for success feel
  }, [playTone]);

  // Play error sound (harsh low tone)
  const playError = useCallback(() => {
    playTone(300, 0.2, 'square'); // Square wave for harsher sound
    setTimeout(() => playTone(200, 0.15, 'square'), 100);
  }, [playTone]);

  // Play warning sound (medium tone)
  const playWarning = useCallback(() => {
    playTone(500, 0.2, 'sine');
  }, [playTone]);

  // Play sound based on notification type
  const playSound = useCallback(
    (type) => {
      switch (type) {
        case 'success':
          playSuccess();
          break;
        case 'error':
        case 'danger':
          playError();
          break;
        case 'warning':
          playWarning();
          break;
        default:
          // No sound for info
          break;
      }
    },
    [playSuccess, playError, playWarning]
  );

  return {
    playSuccess,
    playError,
    playWarning,
    playSound,
  };
}
