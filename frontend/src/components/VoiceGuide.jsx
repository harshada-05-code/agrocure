import React, { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';

export default function VoiceGuide({ text, lang = 'hi', labelPlay = 'Listen', labelStop = 'Stop' }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    const targetLang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.lang = targetLang;

    const matchedVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase())
      || voices.find(v => v.lang.toLowerCase().startsWith(lang));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = 0.82;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={handleToggleSpeech}
      type="button"
      className={`voice-guide-btn${isSpeaking ? ' speaking' : ''}`}
      aria-pressed={isSpeaking}
      aria-label={isSpeaking ? labelStop : labelPlay}
    >
      {isSpeaking ? (
        <Square className="voice-icon" aria-hidden="true" />
      ) : (
        <Volume2 className="voice-icon" aria-hidden="true" />
      )}
      <span>{isSpeaking ? labelStop : labelPlay}</span>
    </button>
  );
}
