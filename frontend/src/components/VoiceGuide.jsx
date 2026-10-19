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
    
    // Map UI language code to BCP 47 locale tags
    const targetLang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.lang = targetLang;

    // Search for a matching device voice to guarantee proper accent and pronunciation
    const matchedVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase())
      || voices.find(v => v.lang.toLowerCase().startsWith(lang));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = 0.82; // Slightly slower speed for clearer listening in farm environments

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
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${
        isSpeaking 
          ? 'bg-red-600 text-white animate-pulse' 
          : 'bg-green-700 text-white hover:bg-green-800'
      }`}
    >
      {isSpeaking ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
      <span>{isSpeaking ? labelStop : labelPlay}</span>
    </button>
  );
}