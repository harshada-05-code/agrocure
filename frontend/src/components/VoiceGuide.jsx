import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Square } from 'lucide-react';

function normalizeLang(code) {
  return String(code || '').replace('_', '-').toLowerCase();
}

function langMatches(voiceLang, prefixes) {
  const l = normalizeLang(voiceLang);
  return prefixes.some((p) => l === p || l.startsWith(`${p}-`) || l.startsWith(p));
}

/**
 * Pick a device voice that can actually speak.
 * Most Windows/Chrome installs have no Marathi (mr-IN) voice; Hindi (hi-IN)
 * can speak Marathi Devanagari and is the reliable fallback.
 */
export function pickVoice(voices, lang) {
  const list = Array.isArray(voices) ? voices : [];
  const byLang = (prefixes) => list.find((v) => langMatches(v.lang, prefixes));
  const byName = (re) => list.find((v) => re.test(v.name || ''));

  if (lang === 'mr') {
    return (
      byLang(['mr-in', 'mr']) ||
      byName(/marathi|मराठी/i) ||
      byLang(['hi-in', 'hi']) ||
      byName(/hindi|हिन्दी|हिंदी/i) ||
      byLang(['en-in']) ||
      list.find((v) => v.default) ||
      list[0] ||
      null
    );
  }

  if (lang === 'hi') {
    return (
      byLang(['hi-in', 'hi']) ||
      byName(/hindi|हिन्दी|हिंदी/i) ||
      byLang(['mr-in', 'mr']) ||
      byLang(['en-in']) ||
      list.find((v) => v.default) ||
      list[0] ||
      null
    );
  }

  return (
    byLang(['en-in', 'en-us', 'en-gb', 'en']) ||
    list.find((v) => v.default) ||
    list[0] ||
    null
  );
}

function fallbackLangTag(lang) {
  if (lang === 'mr') return 'hi-IN';
  if (lang === 'hi') return 'hi-IN';
  return 'en-IN';
}

export default function VoiceGuide({ text, lang = 'hi', labelPlay = 'Listen', labelStop = 'Stop' }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const speakTimerRef = useRef(null);
  const keepAliveRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;

    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices() || []);
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopKeepAlive = () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  const startKeepAlive = () => {
    stopKeepAlive();
    // Chrome stops long utterances unless speechSynthesis is nudged.
    keepAliveRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        stopKeepAlive();
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 8000);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      cancelledRef.current = true;
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      stopKeepAlive();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const spokenText = (text || '').trim();
    if (!spokenText) return;

    cancelledRef.current = false;
    const liveVoices = window.speechSynthesis.getVoices();
    const available = liveVoices.length ? liveVoices : voices;
    const matchedVoice = pickVoice(available, lang);

    const utterance = new SpeechSynthesisUtterance(spokenText);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang || fallbackLangTag(lang);
    } else {
      // No listed voices yet (Chrome first click) — use Hindi for Marathi text.
      utterance.lang = fallbackLangTag(lang);
    }
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      if (!cancelledRef.current) {
        setIsSpeaking(true);
        startKeepAlive();
      }
    };
    utterance.onend = () => {
      stopKeepAlive();
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      const err = event?.error;
      if (err === 'interrupted' || err === 'canceled') {
        return;
      }
      stopKeepAlive();
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    // Chrome drops speak() if it is called in the same tick as cancel().
    speakTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    }, 60);
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
