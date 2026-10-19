import React, { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';

/**
 * VoiceGuide - Reads out a text string via browser Web Speech API.
 * Supports mr-IN (Marathi), hi-IN (Hindi), en-US (English).
 * Rate = 0.85 for clear listening in noisy farm environments.
 *
 * Props:
 *   text    {string}  - The full text to speak.
 *   lang    {string}  - Active language: 'mr' | 'hi' | 'en'
 *   labelPlay  {string}  - ARIA + button label for play (from translations)
 *   labelStop  {string}  - ARIA + button label for stop (from translations)
 */
export default function VoiceGuide({ text, lang, labelPlay, labelStop }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('speechSynthesis' in window);
  }, []);

  // Stop when component unmounts or text/lang changes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
    };
  }, [text, lang]);

  if (!supported || !text) return null;

  const localeBCP47 = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';

  const handlePlay = () => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = localeBCP47;
    utt.rate = 0.85;
    utt.onend  = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <button
      className={`voice-guide-btn ${speaking ? 'speaking' : ''}`}
      onClick={speaking ? handleStop : handlePlay}
      aria-label={speaking ? labelStop : labelPlay}
      aria-pressed={speaking}
      type="button"
    >
      {speaking ? (
        <>
          <Square size={17} aria-hidden="true" />
          <span>{labelStop}</span>
        </>
      ) : (
        <>
          <Volume2 size={17} aria-hidden="true" />
          <span>{labelPlay}</span>
        </>
      )}
    </button>
  );
}
