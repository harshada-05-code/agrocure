import React, { useState, useEffect, useRef } from 'react';
import {
  Leaf,
  Camera,
  FileText,
  ShieldCheck,
  ChevronRight,
  Home,
  History,
  HelpCircle,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Eye,
  Check,
  RotateCcw,
  Sun,
  Type,
  Landmark,
  Bug,
  HelpCircle as QuestionIcon,
} from 'lucide-react';
import { translations } from './translations';
import { diagnoseCropImage, checkBackendHealth } from './apiService';
import { compressLeafImage } from './imageCompressor';
import {
  getConfidenceBand,
  isLowConfidenceOrUnclear,
  isInsectPest,
  isNoDiseaseDetected,
  isConfusableCondition,
  getDifferentialDiagnosisNote,
} from './confidenceHelper';
import { GOVERNMENT_SCHEMES } from './schemes.data';
import VoiceGuide from './components/VoiceGuide';

export default function App() {
  // Persistent Language preference
  const [lang, setLang] = useState(() => localStorage.getItem('agrocure_lang') || 'hi');
  
  // Persistent Text Size (normal / large)
  const [largeText, setLargeText] = useState(() => localStorage.getItem('agrocure_font_size') === 'large');
  
  // Persistent Sunlight High-Contrast Mode
  const [sunlightMode, setSunlightMode] = useState(() => localStorage.getItem('agrocure_sunlight') === 'true');

  // Persistent Farmer Data & Privacy Consent
  const [consentChoice, setConsentChoice] = useState(() => localStorage.getItem('agrocure_consent'));

  // Active navigation tab ('home' | 'diagnose' | 'schemes' | 'help')
  const [activeTab, setActiveTab] = useState('home');

  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepStatus, setStepStatus] = useState('');
  const [error, setError] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [activeRemedyTab, setActiveRemedyTab] = useState('chemical');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [farmerFeedback, setFarmerFeedback] = useState(null);

  // Recent scans (only persisted if consent is not explicitly rejected)
  const [recentScans, setRecentScans] = useState(() => {
    try {
      const saved = localStorage.getItem('agrocure_scans');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          name: 'Soyabean_Rust',
          time: '10:42 AM',
          band: 'possible',
          healthy: false,
        },
        {
          id: '2',
          name: 'Healthy_Soyabean',
          time: '4:18 PM',
          band: 'likely',
          healthy: true,
        },
      ];
    } catch {
      return [];
    }
  });

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const t = translations[lang] || translations.hi;

  // Apply typography and sunlight mode classes to document body
  useEffect(() => {
    if (largeText) {
      document.body.classList.add('large-text-mode');
    } else {
      document.body.classList.remove('large-text-mode');
    }
    localStorage.setItem('agrocure_font_size', largeText ? 'large' : 'normal');
  }, [largeText]);

  useEffect(() => {
    if (sunlightMode) {
      document.body.classList.add('sunlight-mode');
    } else {
      document.body.classList.remove('sunlight-mode');
    }
    localStorage.setItem('agrocure_sunlight', sunlightMode ? 'true' : 'false');
  }, [sunlightMode]);

  useEffect(() => {
    localStorage.setItem('agrocure_lang', lang);
  }, [lang]);

  // Periodic Backend Health Monitoring
  useEffect(() => {
    async function checkHealth() {
      try {
        await checkBackendHealth();
        setIsBackendOnline(true);
      } catch {
        setIsBackendOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Photo selection with client-side compression
  const processImageFile = async (file) => {
    if (!file) return;

    setError(null);
    setLoading(true);
    setShowHeatmap(false);
    setFarmerFeedback(null);
    setStepStatus(t.stepReceived);

    try {
      // Local preview immediately for instant feedback
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Step 1: Compress image client-side for low-end phones & 2G/3G connections
      setStepStatus(t.stepCompressing);
      const readyFile = await compressLeafImage(file, 800, 0.78);
      setImageFile(readyFile);

      // Step 2: Post to NestJS Gateway
      setStepStatus(t.stepAnalyzing);
      const result = await diagnoseCropImage(readyFile);
      setDiagnosis(result);
      setStepStatus(t.stepDone);
      setActiveTab('diagnose');

      // Step 3: Save to recent scans if farmer consented
      if (consentChoice !== 'no') {
        const topConfidence = result.diagnosis.confidence;
        const newScan = {
          id: Date.now().toString(),
          name: result.diagnosis.predicted_class,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          band: getConfidenceBand(topConfidence),
          healthy: isNoDiseaseDetected(result.diagnosis.predicted_class),
        };

        setRecentScans((prev) => {
          const updated = [newScan, ...prev.slice(0, 4)];
          localStorage.setItem('agrocure_scans', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || t.errorConnecting);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Retry previous photo upload without losing user image
  const retryDiagnosis = () => {
    if (imageFile) {
      processImageFile(imageFile);
    } else {
      cameraInputRef.current?.click();
    }
  };

  // Consent handler
  const handleConsent = (choice) => {
    setConsentChoice(choice);
    localStorage.setItem('agrocure_consent', choice);
    if (choice === 'no') {
      localStorage.removeItem('agrocure_scans');
      setRecentScans([]);
    }
  };

  // Farmer feedback rating
  const handleFeedback = (response) => {
    setFarmerFeedback(response);
  };

  // Speech Synthesis Substitutivity
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!diagnosis) return;

    const predClass = diagnosis.diagnosis.predicted_class;
    const diseaseName = t.diseaseNames[predClass] || predClass;
    const bandLabel = t.bands[getConfidenceBand(diagnosis.diagnosis.confidence)];

    let speechText = `${t.diagnosisResult}: ${diseaseName}. ${t.confidence}: ${bandLabel}. `;

    if (isNoDiseaseDetected(predClass)) {
      speechText += `${t.noDiseaseDetected} `;
    } else if (isInsectPest(predClass)) {
      speechText += `${t.insectPestNotice}. `;
    }

    const diffNote = getDifferentialDiagnosisNote(predClass, t);
    if (diffNote) {
      speechText += `${diffNote} `;
    }

    if (diagnosis.remedy.chemical?.medicine) {
      speechText += `${t.chemicalTab}: ${diagnosis.remedy.chemical.medicine}. ${t.labelInstructionsOnly}. `;
    }

    if (diagnosis.remedy.organic?.solution) {
      speechText += `${t.organicTab}: ${diagnosis.remedy.organic.solution}. `;
    }

    speechText += t.mandatoryPesticideSafety;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const resetScan = () => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setImageFile(null);
    setImagePreview(null);
    setDiagnosis(null);
    setError(null);
    setShowHeatmap(false);
    setFarmerFeedback(null);
    setActiveTab('home');
  };

  const primaryScore = diagnosis?.diagnosis?.confidence ?? 0;
  const isUnclearDiagnosis = diagnosis ? isLowConfidenceOrUnclear(primaryScore) : false;
  const topClass = diagnosis?.diagnosis?.predicted_class || '';

  // Build voice narration text for VoiceGuide
  const voiceText = React.useMemo(() => {
    if (!diagnosis) return '';
    const predClass = diagnosis.diagnosis.predicted_class;
    const diseaseName = t.diseaseNames[predClass] || predClass;
    const bandLabel = t.bands[getConfidenceBand(diagnosis.diagnosis.confidence)];
    let text = `${t.diagnosisResult}: ${diseaseName}. ${t.confidence}: ${bandLabel}. `;
    if (isNoDiseaseDetected(predClass)) {
      text += `${t.noDiseaseDetected} `;
    } else if (isInsectPest(predClass)) {
      text += `${t.insectPestNotice}. `;
    }
    const diffNote = getDifferentialDiagnosisNote(predClass, t);
    if (diffNote) text += `${diffNote} `;
    if (diagnosis.remedy?.chemical?.medicine) {
      text += `${t.chemicalTab}: ${diagnosis.remedy.chemical.medicine}. ${t.labelInstructionsOnly}. `;
    }
    if (diagnosis.remedy?.organic?.solution) {
      text += `${t.organicTab}: ${diagnosis.remedy.organic.solution}. `;
    }
    text += t.mandatoryPesticideSafety;
    return text;
  }, [diagnosis, lang, t]);

  return (
    <main className="agro-shell">
      {/* Accessibility & Customizability Bar */}
      <div className="accessibility-bar" role="toolbar" aria-label="Accessibility options">
        <button
          className="a11y-btn"
          onClick={() => setLargeText(!largeText)}
          aria-label={largeText ? t.normalText : t.largeText}
        >
          <Type size={18} />
          <span>{largeText ? 'A- ' + t.normalText : 'A+ ' + t.largeText}</span>
        </button>

        <button
          className="a11y-btn"
          onClick={() => setSunlightMode(!sunlightMode)}
          aria-label={sunlightMode ? t.normalMode : t.sunlightMode}
        >
          <Sun size={18} />
          <span>{sunlightMode ? t.normalMode : t.sunlightMode}</span>
        </button>
      </div>

      {/* Top Header */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Leaf size={24} strokeWidth={2.4} />
          </span>
          <span>
            Agro<span>Cure</span>
          </span>
        </div>

        <div className="top-actions">
          <div className="language-toggle" role="group" aria-label="Choose Language">
            <button
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              className={lang === 'hi' ? 'active' : ''}
              onClick={() => setLang('hi')}
              aria-label="हिंदी भाषा चुनें"
            >
              हिंदी
            </button>
            <button
              className={lang === 'mr' ? 'active' : ''}
              onClick={() => setLang('mr')}
              aria-label="मराठी भाषा निवडा"
            >
              मराठी
            </button>
          </div>
          {/* VoiceGuide in header for instant accessibility */}
          {diagnosis && (
            <VoiceGuide
              text={voiceText}
              lang={lang}
              labelPlay={t.listenVoice}
              labelStop={t.stopVoice}
            />
          )}
        </div>
      </header>

      {/* Soybean Scope Notice Banner — concise micro-copy */}
      <div className="soybean-scope-banner" role="status">
        <AlertCircle size={18} style={{ flexShrink: 0 }} />
        <span>{t.soybeanOnlyMicro || t.soybeanOnlyWarning}</span>
      </div>

      {/* Greeting Banner */}
      <section className="welcome-row">
        <div>
          <p className="eyebrow">
            {t.offlineReady}{' '}
            <span
              className={`status-dot ${isBackendOnline ? '' : 'disconnected'}`}
              aria-hidden="true"
            ></span>
          </p>
          <h1>{t.greeting}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="avatar" aria-hidden="true">
          🌱
        </div>
      </section>

      {/* Privacy Consent Prompt (if not answered yet) */}
      {!consentChoice && (
        <section className="consent-card" aria-labelledby="consent-title">
          <div className="consent-header" id="consent-title">
            <ShieldCheck size={20} />
            <span>{t.privacyTitle}</span>
          </div>
          <p style={{ fontSize: '0.88rem' }}>{t.privacyQuestion}</p>
          <div className="consent-buttons">
            <button className="consent-btn" onClick={() => handleConsent('yes')}>
              {t.consentYes}
            </button>
            <button className="consent-btn" onClick={() => handleConsent('no')}>
              {t.consentNo}
            </button>
            <button className="consent-btn" onClick={() => handleConsent('not_sure')}>
              {t.consentNotSure}
            </button>
          </div>
        </section>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* View: Government Schemes Tab */}
      {activeTab === 'schemes' && (
        <section className="schemes-view" aria-labelledby="schemes-heading">
          <div className="section-heading">
            <h2 id="schemes-heading">{t.schemesSectionTitle}</h2>
          </div>

          {GOVERNMENT_SCHEMES.map((scheme) => (
            <article key={scheme.id} className="scheme-card">
              <div className="scheme-header">
                <h3>{scheme.name[lang] || scheme.name.en}</h3>
                <span
                  className={`verified-badge ${
                    scheme.verified ? 'verified' : 'unverified'
                  }`}
                >
                  {scheme.verified ? `✓ ${t.schemeVerifiedBadge}` : `⏳ ${t.schemeUnverifiedBadge}`}
                </span>
              </div>

              <p className="scheme-date">
                {t.schemeLastChecked}: {scheme.last_checked}
              </p>

              <p className="scheme-summary">
                {scheme.shortSummary[lang] || scheme.shortSummary.en}
              </p>

              <div className="scheme-advice">
                <strong>{scheme.actionAdvice[lang] || scheme.actionAdvice.en}</strong>
              </div>
            </article>
          ))}

          <div className="scheme-confirm-notice">
            <AlertCircle size={18} style={{ display: 'inline', marginRight: '6px' }} />
            {t.schemeConfirmNotice}
          </div>

          <div style={{ marginTop: '16px' }}>
            <button className="reset-btn" onClick={() => setActiveTab('home')}>
              ← {t.home}
            </button>
          </div>
        </section>
      )}

      {/* View: Standard Scanner & Live Results */}
      {activeTab !== 'schemes' && (
        <>
          {/* Scan Action Card */}
          {!diagnosis && !loading && (
            <section className="scan-card" aria-labelledby="scan-heading">
              <div className="scan-copy">
                <div className="round-icon">
                  <Camera size={26} />
                </div>
                <div>
                  <h2 id="scan-heading">{t.scanTitle}</h2>
                  <p>{t.scanSubtitle}</p>
                </div>
              </div>

              <div className="scan-actions">
                <button
                  className="primary-button"
                  onClick={() => cameraInputRef.current?.click()}
                  aria-label={t.openCamera}
                >
                  <Camera size={20} />
                  <span>{t.openCamera}</span>
                </button>
                <button
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={t.choosePhoto}
                >
                  <FileText size={20} />
                  <span>{t.choosePhoto}</span>
                </button>
              </div>

              <div className="secure-note">
                <ShieldCheck size={16} />
                <span>{t.secureNote}</span>
              </div>
            </section>
          )}

          {/* Observability: Progress Card */}
          {loading && (
            <div className="progress-card" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <h3 style={{ fontSize: '1.15rem', color: '#2d5a27', marginBottom: '8px' }}>
                {stepStatus || t.diagnosing}
              </h3>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Analyzing leaf"
                  style={{
                    width: '130px',
                    height: '130px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    margin: '8px auto',
                    display: 'block',
                  }}
                />
              )}
            </div>
          )}

          {/* Responsiveness & Error Recovery */}
          {error && (
            <div
              style={{
                background: '#fee2e2',
                border: '2px solid #ef4444',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '18px',
                color: '#991b1b',
              }}
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={22} />
                <strong style={{ fontSize: '1rem' }}>{error}</strong>
              </div>
              <button
                className="primary-button"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={retryDiagnosis}
              >
                <RotateCcw size={18} />
                {t.retryBtn}
              </button>
            </div>
          )}

          {/* Live Diagnosis Result View */}
          {diagnosis && !loading && (
            <section className="result-container" aria-labelledby="result-heading">
              {/* Case 1: Unclear / Low Confidence */}
              {isUnclearDiagnosis ? (
                <div className="not-sure-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={24} color="#9f1239" />
                    <h4 id="result-heading">{t.notSureTitle}</h4>
                  </div>
                  <p style={{ marginTop: '8px', fontSize: '0.92rem', color: '#881337' }}>
                    {t.notSureAdvice}
                  </p>
                  <button
                    className="primary-button"
                    style={{ width: '100%', marginTop: '14px' }}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera size={18} />
                    {t.retakePhoto}
                  </button>
                </div>
              ) : (
                <>
                  {/* Result Header */}
                  <div className="result-header">
                    <div className="result-title-group">
                      {isNoDiseaseDetected(topClass) ? (
                        <span className="category-tag healthy">
                          <Check size={14} />
                          {t.diseaseNames.Healthy_Soyabean}
                        </span>
                      ) : isInsectPest(topClass) ? (
                        <span className="category-tag pest">
                          <Bug size={14} />
                          {t.insectPestNotice}
                        </span>
                      ) : (
                        <span className="category-tag disease">
                          <AlertCircle size={14} />
                          {t.diseaseNotice}
                        </span>
                      )}

                      <h3 id="result-heading">
                        {isNoDiseaseDetected(topClass)
                          ? t.noDiseaseDetected
                          : t.diseaseNames[topClass] || topClass}
                      </h3>
                    </div>

                    <div className="confidence-badge">
                      <span
                        className={`confidence-band band-${getConfidenceBand(primaryScore)}`}
                      >
                        {getConfidenceBand(primaryScore) === 'likely' && '✓ '}
                        {getConfidenceBand(primaryScore) === 'possible' && '? '}
                        {getConfidenceBand(primaryScore) === 'not_sure' && '⚠ '}
                        {t.bands[getConfidenceBand(primaryScore)]}
                      </span>
                    </div>
                  </div>

                  {/* VoiceGuide — prominent audio in results panel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <VoiceGuide
                      text={voiceText}
                      lang={lang}
                      labelPlay={t.listenVoice}
                      labelStop={t.stopVoice}
                    />
                    {diagnosis._isMockFallback && (
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 700,
                        background: '#fef3c7', color: '#78350f',
                        border: '1px solid #f59e0b', borderRadius: '6px',
                        padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        ⚡ {lang === 'mr' ? 'ऑफलाइन डेमो' : lang === 'hi' ? 'ऑफ़लाइन डेमो' : 'Offline Demo'}
                      </span>
                    )}
                  </div>

                  {/* Leaf & GradCAM Heatmap Toggle */}
                  <div className="image-inspection">
                    <div className="image-frame">
                      <img
                        src={showHeatmap ? diagnosis.diagnosis.gradcam_heatmap_url : imagePreview}
                        alt="Soybean leaf scan"
                      />
                    </div>
                    <button
                      className="toggle-view-btn"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      aria-label={showHeatmap ? t.originalPhoto : t.gradcamToggle}
                    >
                      <Eye size={16} />
                      <span>{showHeatmap ? t.originalPhoto : t.gradcamToggle}</span>
                    </button>
                    {showHeatmap && (
                      <p className="heatmap-caption">{t.heatmapExplanation}</p>
                    )}
                  </div>

                  {/* Differential Diagnosis Warning ("Could also be...") */}
                  {isConfusableCondition(topClass) && (
                    <div className="differential-box" role="note">
                      <div className="diff-header">
                        <AlertTriangle size={18} />
                        <span>{t.couldAlsoBeTitle}</span>
                      </div>
                      <p>{getDifferentialDiagnosisNote(topClass, t)}</p>
                    </div>
                  )}

                  {/* Top 3 Possibilities (Qualitative Bands, Not Raw Percentages) */}
                  <div className="candidates-section">
                    <h4>{t.topCandidates}</h4>
                    {diagnosis.diagnosis.top3_classes.map((cand, idx) => (
                      <div key={idx} className="candidate-row">
                        <div className="candidate-labels">
                          <span>{t.diseaseNames[cand.class_name] || cand.class_name}</span>
                          <span
                            className={`confidence-band band-${getConfidenceBand(
                              cand.confidence
                            )}`}
                            style={{ minHeight: '26px', padding: '2px 8px', fontSize: '0.78rem' }}
                          >
                            {t.bands[getConfidenceBand(cand.confidence)]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Agronomic Remedies Tabs (No specific dosages; label-based) */}
                  <div className="remedies-section">
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>
                      {t.remediesTitle}
                    </h4>

                    <div className="remedies-nav" role="tablist">
                      <button
                        className={`remedy-tab-btn ${
                          activeRemedyTab === 'chemical' ? 'active' : ''
                        }`}
                        onClick={() => setActiveRemedyTab('chemical')}
                        role="tab"
                        aria-selected={activeRemedyTab === 'chemical'}
                      >
                        {t.chemicalTab}
                      </button>
                      <button
                        className={`remedy-tab-btn ${
                          activeRemedyTab === 'organic' ? 'active' : ''
                        }`}
                        onClick={() => setActiveRemedyTab('organic')}
                        role="tab"
                        aria-selected={activeRemedyTab === 'organic'}
                      >
                        {t.organicTab}
                      </button>
                      <button
                        className={`remedy-tab-btn ${
                          activeRemedyTab === 'cultural' ? 'active' : ''
                        }`}
                        onClick={() => setActiveRemedyTab('cultural')}
                        role="tab"
                        aria-selected={activeRemedyTab === 'cultural'}
                      >
                        {t.culturalTab}
                      </button>
                    </div>

                    <div className="remedy-card-content">
                      {activeRemedyTab === 'chemical' && (
                        <div>
                          <div className="remedy-item">
                            <strong>दवा / Chemical Active Ingredient</strong>
                            <p>{diagnosis.remedy.chemical?.medicine}</p>
                          </div>
                          <div className="remedy-item">
                            <strong>{t.dosage}</strong>
                            <p>{diagnosis.remedy.chemical?.dosage || t.labelInstructionsOnly}</p>
                          </div>
                          <div className="remedy-item">
                            <strong>{t.safetyInterval}</strong>
                            <p>
                              {diagnosis.remedy.chemical?.safety_interval_days} {t.days}
                            </p>
                          </div>

                          {/* Mandatory Pesticide Safety Advisory */}
                          <div className="pesticide-safety-card">
                            <ShieldCheck size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p>{t.mandatoryPesticideSafety}</p>
                          </div>
                        </div>
                      )}

                      {activeRemedyTab === 'organic' && (
                        <div className="remedy-item">
                          <strong>जैविक समाधान / Organic Solution</strong>
                          <p>{diagnosis.remedy.organic?.solution}</p>
                        </div>
                      )}

                      {activeRemedyTab === 'cultural' && (
                        <div className="remedy-item">
                          <strong>खेत प्रबंधन / Cultural Practices</strong>
                          <p>{diagnosis.remedy.cultural}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Migratability: Jump to Government Schemes */}
                  <button
                    className="schemes-jump-btn"
                    onClick={() => setActiveTab('schemes')}
                  >
                    <Landmark size={18} />
                    <span>{t.viewSchemesBtn}</span>
                  </button>

                  {/* Farmer Feedback Section */}
                  <div className="feedback-box">
                    <div className="feedback-header">{t.feedbackTitle}</div>
                    {farmerFeedback ? (
                      <p style={{ color: '#166534', fontWeight: 700 }}>{t.feedbackThankYou}</p>
                    ) : (
                      <div className="feedback-actions">
                        <button
                          className="feedback-btn"
                          onClick={() => handleFeedback('yes')}
                        >
                          {t.feedbackYes}
                        </button>
                        <button
                          className="feedback-btn"
                          onClick={() => handleFeedback('no')}
                        >
                          {t.feedbackNo}
                        </button>
                        <button
                          className="feedback-btn"
                          onClick={() => handleFeedback('not_sure')}
                        >
                          {t.feedbackNotSure}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Speech & New Scan Actions */}
              <div className="actions-footer">
                <VoiceGuide
                  text={voiceText}
                  lang={lang}
                  labelPlay={t.listenVoice}
                  labelStop={t.stopVoice}
                />
                <button className="reset-btn" onClick={resetScan}>
                  <RotateCcw size={16} />
                  <span>{t.newScan}</span>
                </button>
              </div>
            </section>
          )}

          {/* Recent Scans Section */}
          <section className="content-grid" aria-labelledby="scans-heading">
            <div className="main-column">
              <div className="section-heading">
                <h2 id="scans-heading">{t.recentScans}</h2>
              </div>

              {recentScans.map((scan) => (
                <div key={scan.id} className="result-card">
                  <div className={`mini-leaf ${scan.healthy ? 'healthy' : ''}`}>
                    <Leaf size={24} />
                  </div>
                  <div className="result-info">
                    <strong>{t.diseaseNames[scan.name] || scan.name}</strong>
                    <span>{scan.time}</span>
                  </div>
                  <span className={`confidence-band band-${scan.band || 'likely'}`}>
                    {t.bands[scan.band || 'likely']}
                  </span>
                </div>
              ))}
            </div>

            {/* How to take good photo Guide */}
            <aside className="how-card" aria-labelledby="how-heading">
              <div className="how-header">
                <div className="round-icon" style={{ width: '38px', height: '38px' }}>
                  <Sparkles size={20} />
                </div>
                <h2 id="how-heading">{t.howToTitle}</h2>
              </div>
              <div className="step">
                <span>1</span>
                <p>{t.step1}</p>
                <Check size={16} color="#15803d" />
              </div>
              <div className="step">
                <span>2</span>
                <p>{t.step2}</p>
                <Check size={16} color="#15803d" />
              </div>
              <div className="step">
                <span>3</span>
                <p>{t.step3}</p>
                <Check size={16} color="#15803d" />
              </div>
            </aside>
          </section>
        </>
      )}

      {/* Bottom Sticky Navigation */}
      <nav className="bottom-nav" aria-label="Main Navigation">
        <button
          className={activeTab === 'home' ? 'nav-active' : ''}
          onClick={resetScan}
          aria-label={t.home}
        >
          <Home size={22} />
          <span>{t.home}</span>
        </button>
        <button
          className={activeTab === 'diagnose' ? 'nav-active' : ''}
          onClick={() => {
            if (!diagnosis) {
              cameraInputRef.current?.click();
            } else {
              setActiveTab('diagnose');
            }
          }}
          aria-label={t.diagnoseTab}
        >
          <History size={22} />
          <span>{t.diagnoseTab}</span>
        </button>
        <button
          className={activeTab === 'schemes' ? 'nav-active' : ''}
          onClick={() => setActiveTab('schemes')}
          aria-label={t.schemesTab}
        >
          <Landmark size={22} />
          <span>{t.schemesTab}</span>
        </button>
        <button
          onClick={() =>
            alert(
              lang === 'mr'
                ? 'किसान कॉल सेंटर मोफत हेल्पलाइन: १८००-१८०-१५५१ वर संपर्क साधा.'
                : lang === 'hi'
                ? 'किसान कॉल सेंटर टोल-फ्री हेल्पलाइन: 1800-180-1551 पर कॉल करें।'
                : 'Kisan Call Center Toll-Free Helpline: 1800-180-1551.'
            )
          }
          aria-label={t.helpTab}
        >
          <QuestionIcon size={22} />
          <span>{t.helpTab}</span>
        </button>
      </nav>
    </main>
  );
}
