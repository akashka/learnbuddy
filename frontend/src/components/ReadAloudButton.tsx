import { useState, useEffect, useCallback } from 'react';

interface ReadAloudButtonProps {
  /** Text content to read aloud */
  text: string;
  /** Use female voice when true (default), male when false. Opposite of listener's gender. */
  preferFemaleVoice?: boolean;
  /** Optional class name for the button */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * Picks the best Indian English voice. Prefers en-IN, falls back to en-GB, en-US.
 * Uses opposite gender: preferFemaleVoice=true → female voice, false → male voice.
 */
function getBestVoice(preferFemale: boolean): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const indian = voices.filter((v) => v.lang.startsWith('en-IN'));
  const fallback = voices.filter((v) => v.lang.startsWith('en-GB') || v.lang.startsWith('en-US'));
  const pool = indian.length > 0 ? indian : fallback.length > 0 ? fallback : voices;

  // Prefer localService for smoother playback
  const local = pool.filter((v) => v.localService);
  const target = local.length > 0 ? local : pool;

  // Filter by gender: female voices often have "Female" in name, male have "Male"
  const femaleVoices = target.filter(
    (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('veena')
  );
  const maleVoices = target.filter(
    (v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('ravi')
  );

  if (preferFemale && femaleVoices.length > 0) return femaleVoices[0];
  if (!preferFemale && maleVoices.length > 0) return maleVoices[0];
  // Fallback: use first available from pool
  return target[0] ?? null;
}

export function ReadAloudButton({
  text,
  preferFemaleVoice = true,
  className = '',
  'aria-label': ariaLabel = 'Read aloud',
}: ReadAloudButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      setVoicesReady(true);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(() => {
    const t = text?.trim();
    if (!t || !voicesReady) return;

    if (isSpeaking) {
      stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(t);
    const voice = getBestVoice(preferFemaleVoice);
    if (voice) utterance.voice = voice;

    // Kid-friendly: slightly slower, clear pace
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [text, preferFemaleVoice, voicesReady, isSpeaking, stop]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleClick = () => {
    if (isSpeaking) stop();
    else speak();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSpeaking ? 'Stop reading' : ariaLabel}
      aria-pressed={isSpeaking}
      title={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
      className={`inline-flex items-center justify-center rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-brand-700 transition hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 ${className}`}
    >
      <span className="sr-only">{isSpeaking ? 'Stop' : 'Read aloud'}</span>
      {isSpeaking ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 9.25 9.25 0 0 0 0-13.668.75.75 0 0 1 0-1.06Z" />
          <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6.5 6.5 0 0 1 0 9.192.75.75 0 0 1-1.06-1.061 5 5 0 0 0 0-7.07.75.75 0 0 1 0-1.06Z" />
        </svg>
      )}
    </button>
  );
}
