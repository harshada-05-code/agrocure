import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Leaf,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Home,
  History,
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
  Focus,
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
import GradCamOverlay from './components/GradCamOverlay';

function formatScanWhen(scan) {
  if (scan.date && scan.time) {
    return `${scan.date} · ${scan.time}`;
  }
  if (scan.time) return scan.time;
  return '';
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('agrocure_lang') || 'hi');
  const [largeText, setLargeText] = useState(() => localStorage.getItem('agrocure_font_size') === 'large');
  const [sunlightMode, setSunlightMode] = useState(() => localStorage.getItem('agrocure_sunlight') === 'true');
  const [consentChoice, setConsentChoice] = useState(() => localStorage.getItem('agrocure_consent'));

  // Active tab: 'home' | 'history' | 'schemes' | 'help'
  const [activeTab, setActiveTab] = useState('home');

  const [isBrowserOffline, setIsBrowserOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepStatus, setStepStatus] = useState('');
  const [error, setError] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [activeRemedyTab, setActiveRemedyTab] = useState('chemical');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [farmerFeedback, setFarmerFeedback] = useState(null);

  const [recentScans, setRecentScans] = useState(() => {
    try {
      const saved = localStorage.getItem('agrocure_scans');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          name: 'Soyabean_Rust',
          date: '18 Oct 2026',
          time: '10:42 AM',
          band: 'possible',
          healthy: false,
          thumbnail: null,
        },
        {
          id: '2',
          name: 'Healthy_Soyabean',
          date: '17 Oct 2026',
          time: '4:18 PM',
          band: 'likely',
          healthy: true,
          thumbnail: null,
        },
      ];
    } catch {
      return [];
    }
  });

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recentSectionRef = useRef(null);
  const t = translations[lang] || translations.hi;
  const englishNames = translations.en.diseaseNames;

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

  // Browser online/offline (not backend health)
  useEffect(() => {
    const goOnline = () => setIsBrowserOffline(false);
    const goOffline = () => setIsBrowserOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    setIsBrowserOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Keep backend health check for diagnosis resilience (no UI badge)
  useEffect(() => {
    async function checkHealth() {
      try {
        await checkBackendHealth();
      } catch {
        /* silent — offline badge uses navigator.onLine only */
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const processImageFile = async (file) => {
    if (!file) return;

    setError(null);
    setLoading(true);
    setShowHeatmap(false);
    setFarmerFeedback(null);
    setStepStatus(t.stepReceived);
    setActiveTab('home');

    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      setStepStatus(t.stepCompressing);
      const readyFile = await compressLeafImage(file, 800, 0.78);
      setImageFile(readyFile);

      setStepStatus(t.stepAnalyzing);
      const result = await diagnoseCropImage(readyFile);
      setDiagnosis(result);
      setStepStatus(t.stepDone);

      if (consentChoice !== 'no') {
        const topConfidence = result.diagnosis.confidence;
        const now = new Date();
        const newScan = {
          id: Date.now().toString(),
          name: result.diagnosis.predicted_class,
          date: now.toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'mr' ? 'mr-IN' : 'hi-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          band: getConfidenceBand(topConfidence),
          healthy: isNoDiseaseDetected(result.diagnosis.predicted_class),
          thumbnail: previewUrl,
        };

        setRecentScans((prev) => {
          const updated = [newScan, ...prev].slice(0, 10);
          try {
            // Persist without large data-URLs if storage is tight
            const forStorage = updated.map(({ thumbnail, ...rest }) => ({
              ...rest,
              thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('blob:') ? null : thumbnail,
            }));
            localStorage.setItem('agrocure_scans', JSON.stringify(forStorage));
          } catch {
            /* ignore quota */
          }
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
    e.target.value = '';
  };

  const retryDiagnosis = () => {
    if (imageFile) {
      processImageFile(imageFile);
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleConsent = (choice) => {
    setConsentChoice(choice);
    localStorage.setItem('agrocure_consent', choice);
    if (choice === 'no') {
      localStorage.removeItem('agrocure_scans');
      setRecentScans([]);
    }
  };

  const handleFeedback = (response) => {
    setFarmerFeedback(response);
  };

  const resetScan = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setImageFile(null);
    setImagePreview(null);
    setDiagnosis(null);
    setError(null);
    setShowHeatmap(false);
    setFarmerFeedback(null);
    setActiveTab('home');
  };

  const goHistory = () => {
    setActiveTab('history');
    if (diagnosis) {
      setDiagnosis(null);
      setImagePreview(null);
      setImageFile(null);
      setError(null);
    }
    requestAnimationFrame(() => {
      recentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const goHelp = () => {
    setActiveTab('help');
    alert(t.helpAlert);
  };

  const primaryScore = diagnosis?.diagnosis?.confidence ?? 0;
  const isUnclearDiagnosis = diagnosis ? isLowConfidenceOrUnclear(primaryScore) : false;
  const topClass = diagnosis?.diagnosis?.predicted_class || '';
  const bandKey = getConfidenceBand(primaryScore);
  const latestThree = recentScans.slice(0, 3);

  const voiceText = useMemo(() => {
    if (!diagnosis) {
      return t.voiceWelcome;
    }
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
  }, [diagnosis, t]);

  const showEnglishSecondary = lang !== 'en';

  return (
    <main className="agro-shell">
      <div className="accessibility-bar" role="toolbar" aria-label={t.textSize}>
        <button
          type="button"
          className="a11y-btn"
          onClick={() => setLargeText(!largeText)}
          aria-pressed={largeText}
          aria-label={largeText ? t.normalText : t.largeText}
        >
          <Type size={18} aria-hidden="true" />
          <span>{largeText ? t.normalText : t.largeText}</span>
        </button>

        <button
          type="button"
          className="a11y-btn"
          onClick={() => setSunlightMode(!sunlightMode)}
          aria-pressed={sunlightMode}
          aria-label={sunlightMode ? t.normalMode : t.sunlightMode}
        >
          <Sun size={18} aria-hidden="true" />
          <span>{sunlightMode ? t.normalMode : t.sunlightMode}</span>
        </button>
      </div>

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
          <div className="language-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              aria-label="English"
            >
              EN
            </button>
            <button
              type="button"
              className={lang === 'hi' ? 'active' : ''}
              onClick={() => setLang('hi')}
              aria-pressed={lang === 'hi'}
              aria-label="हिंदी"
            >
              हिंदी
            </button>
            <button
              type="button"
              className={lang === 'mr' ? 'active' : ''}
              onClick={() => setLang('mr')}
              aria-pressed={lang === 'mr'}
              aria-label="मराठी"
            >
              मराठी
            </button>
          </div>

          <VoiceGuide
            text={voiceText}
            lang={lang}
            labelPlay={t.listenVoice}
            labelStop={t.stopVoice}
          />
        </div>
      </header>

      <div className="soybean-scope-banner" role="status">
        <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span>{t.soybeanOnlyMicro || t.soybeanOnlyWarning}</span>
      </div>

      {isBrowserOffline && (
        <div className="offline-badge" role="status">
          <AlertTriangle size={20} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>{t.offlineBadgeTitle}</strong>
            <span>{t.offlineBadgeDetail}</span>
          </div>
        </div>
      )}

      <section className="welcome-row">
        <div>
          <h1>{t.greeting}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="avatar" aria-hidden="true">
          <Leaf size={26} />
        </div>
      </section>

      {!consentChoice && (
        <section className="consent-card" aria-labelledby="consent-title">
          <div className="consent-header" id="consent-title">
            <ShieldCheck size={20} aria-hidden="true" />
            <span>{t.privacyTitle}</span>
          </div>
          <p>{t.privacyQuestion}</p>
          <div className="consent-buttons">
            <button type="button" className="consent-btn" onClick={() => handleConsent('yes')}>
              {t.consentYes}
            </button>
            <button type="button" className="consent-btn" onClick={() => handleConsent('no')}>
              {t.consentNo}
            </button>
            <button type="button" className="consent-btn" onClick={() => handleConsent('not_sure')}>
              {t.consentNotSure}
            </button>
          </div>
        </section>
      )}

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
                  className={`verified-badge ${scheme.verified ? 'verified' : 'unverified'}`}
                >
                  {scheme.verified ? t.schemeVerifiedBadge : t.schemeUnverifiedBadge}
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
            <AlertCircle size={18} aria-hidden="true" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            {t.schemeConfirmNotice}
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="button" className="reset-btn" onClick={() => setActiveTab('home')}>
              {t.home}
            </button>
          </div>
        </section>
      )}

      {activeTab !== 'schemes' && (
        <>
          {!diagnosis && !loading && (
            <section className="scan-card" aria-labelledby="scan-heading">
              <div className="scan-copy">
                <div className="round-icon" aria-hidden="true">
                  <Camera size={26} />
                </div>
                <div>
                  <h2 id="scan-heading">{t.scanTitle}</h2>
                  <p>{t.scanSubtitle}</p>
                </div>
              </div>

              <div className="scan-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => cameraInputRef.current?.click()}
                  aria-label={t.openCamera}
                >
                  <Camera size={20} aria-hidden="true" />
                  <span>{t.openCamera}</span>
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={t.choosePhoto}
                >
                  <ImageIcon size={20} aria-hidden="true" />
                  <span>{t.choosePhoto}</span>
                </button>
              </div>

              <div className="secure-note">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>{t.secureNote}</span>
              </div>
            </section>
          )}

          {loading && (
            <div className="progress-card" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <h3 style={{ fontSize: '1.15rem', color: '#166534', marginBottom: '8px' }}>
                {stepStatus || t.diagnosing}
              </h3>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt={t.analyzingAlt}
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

          {error && (
            <div className="error-card" role="alert">
              <div className="error-card-header">
                <AlertCircle size={22} aria-hidden="true" />
                <strong>{error}</strong>
              </div>
              <button type="button" className="primary-button" onClick={retryDiagnosis}>
                <RotateCcw size={18} aria-hidden="true" />
                {t.retryBtn}
              </button>
            </div>
          )}

          {diagnosis && !loading && (
            <section className="result-container" aria-labelledby="result-heading">
              {isUnclearDiagnosis ? (
                <div className="not-sure-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={24} color="#9f1239" aria-hidden="true" />
                    <h4 id="result-heading">{t.notSureTitle}</h4>
                  </div>
                  <p>{t.notSureAdvice}</p>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ marginTop: '14px' }}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera size={18} aria-hidden="true" />
                    {t.retakePhoto}
                  </button>
                </div>
              ) : (
                <>
                  <div className="result-header">
                    <div className="result-title-group">
                      {isNoDiseaseDetected(topClass) ? (
                        <span className="category-tag healthy">
                          <Check size={14} aria-hidden="true" />
                          {t.diseaseNames.Healthy_Soyabean}
                        </span>
                      ) : isInsectPest(topClass) ? (
                        <span className="category-tag pest">
                          <Bug size={14} aria-hidden="true" />
                          {t.insectPestNotice}
                        </span>
                      ) : (
                        <span className="category-tag disease">
                          <AlertCircle size={14} aria-hidden="true" />
                          {t.diseaseNotice}
                        </span>
                      )}

                      <h3 id="result-heading">
                        {isNoDiseaseDetected(topClass)
                          ? t.noDiseaseDetected
                          : t.diseaseNames[topClass] || topClass}
                      </h3>
                      {showEnglishSecondary &&
                        !isNoDiseaseDetected(topClass) &&
                        englishNames[topClass] && (
                          <span className="disease-name-en">{englishNames[topClass]}</span>
                        )}
                    </div>

                    <div className="confidence-badge">
                      <span
                        className={`confidence-band band-${bandKey}`}
                        aria-label={`${t.confidenceBand}: ${t.bands[bandKey]}`}
                      >
                        {t.bands[bandKey]}
                      </span>
                    </div>
                  </div>

                  <div className="image-inspection">
                    <div className="image-frame">
                      {showHeatmap ? (
                        diagnosis.diagnosis.gradcam_heatmap_url && !diagnosis._isMockFallback ? (
                          <img
                            src={diagnosis.diagnosis.gradcam_heatmap_url}
                            alt={t.heatmapAlt}
                          />
                        ) : (
                          <GradCamOverlay imageSrc={imagePreview} />
                        )
                      ) : (
                        <img src={imagePreview} alt={t.leafScanAlt} />
                      )}
                    </div>

                    <button
                      type="button"
                      className="toggle-view-btn"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      aria-pressed={showHeatmap}
                      aria-label={showHeatmap ? t.originalPhoto : t.gradcamToggle}
                    >
                      <Eye size={16} aria-hidden="true" />
                      <span>{showHeatmap ? t.originalPhoto : t.gradcamToggle}</span>
                    </button>
                  </div>

                  {showHeatmap && (
                    <p className="heatmap-caption">{t.heatmapExplanation}</p>
                  )}

                  {isConfusableCondition(topClass) && (
                    <div className="differential-box" role="note">
                      <div className="diff-header">
                        <AlertTriangle size={18} aria-hidden="true" />
                        <span>{t.couldAlsoBeTitle}</span>
                      </div>
                      <p>{getDifferentialDiagnosisNote(topClass, t)}</p>
                    </div>
                  )}

                  <div className="candidates-section">
                    <h4>{t.topCandidates}</h4>
                    {diagnosis.diagnosis.top3_classes.map((cand, idx) => {
                      const candBand = getConfidenceBand(cand.confidence);
                      return (
                        <div key={idx} className="candidate-row">
                          <div className="candidate-labels">
                            <span>
                              {t.diseaseNames[cand.class_name] || cand.class_name}
                              {showEnglishSecondary && englishNames[cand.class_name] && (
                                <span className="disease-name-en">
                                  {englishNames[cand.class_name]}
                                </span>
                              )}
                            </span>
                            <span className={`confidence-band band-${candBand}`}>
                              {t.bands[candBand]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="remedies-section">
                    <h4>{t.remediesTitle}</h4>

                    <div className="remedies-nav" role="tablist">
                      <button
                        type="button"
                        className={`remedy-tab-btn ${activeRemedyTab === 'chemical' ? 'active' : ''}`}
                        onClick={() => setActiveRemedyTab('chemical')}
                        role="tab"
                        aria-selected={activeRemedyTab === 'chemical'}
                      >
                        {t.chemicalTab}
                      </button>
                      <button
                        type="button"
                        className={`remedy-tab-btn ${activeRemedyTab === 'organic' ? 'active' : ''}`}
                        onClick={() => setActiveRemedyTab('organic')}
                        role="tab"
                        aria-selected={activeRemedyTab === 'organic'}
                      >
                        {t.organicTab}
                      </button>
                      <button
                        type="button"
                        className={`remedy-tab-btn ${activeRemedyTab === 'cultural' ? 'active' : ''}`}
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
                            <strong>{t.chemicalIngredient}</strong>
                            <p>{diagnosis.remedy?.chemical?.medicine}</p>
                          </div>
                          <div className="remedy-item">
                            <strong>{t.dosage}</strong>
                            <p>{diagnosis.remedy?.chemical?.dosage || t.labelInstructionsOnly}</p>
                          </div>
                          <div className="remedy-item">
                            <strong>{t.safetyInterval}</strong>
                            <p>
                              {diagnosis.remedy?.chemical?.safety_interval_days} {t.days}
                            </p>
                          </div>

                          <div className="pesticide-safety-card">
                            <ShieldCheck size={22} aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p>{t.mandatoryPesticideSafety}</p>
                          </div>
                        </div>
                      )}

                      {activeRemedyTab === 'organic' && (
                        <div className="remedy-item">
                          <strong>{t.organicSolution}</strong>
                          <p>{diagnosis.remedy?.organic?.solution}</p>
                        </div>
                      )}

                      {activeRemedyTab === 'cultural' && (
                        <div className="remedy-item">
                          <strong>{t.culturalPractices}</strong>
                          <p>{diagnosis.remedy?.cultural}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="schemes-jump-btn"
                    onClick={() => setActiveTab('schemes')}
                  >
                    <Landmark size={18} aria-hidden="true" />
                    <span>{t.viewSchemesBtn}</span>
                  </button>

                  <div className="feedback-box">
                    <div className="feedback-header">{t.feedbackTitle}</div>
                    {farmerFeedback ? (
                      <p style={{ color: '#166534', fontWeight: 700 }}>{t.feedbackThankYou}</p>
                    ) : (
                      <div className="feedback-actions">
                        <button type="button" className="feedback-btn" onClick={() => handleFeedback('yes')}>
                          {t.feedbackYes}
                        </button>
                        <button type="button" className="feedback-btn" onClick={() => handleFeedback('no')}>
                          {t.feedbackNo}
                        </button>
                        <button type="button" className="feedback-btn" onClick={() => handleFeedback('not_sure')}>
                          {t.feedbackNotSure}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="actions-footer">
                <VoiceGuide
                  text={voiceText}
                  lang={lang}
                  labelPlay={t.listenVoice}
                  labelStop={t.stopVoice}
                />
                <button type="button" className="reset-btn" onClick={resetScan}>
                  <RotateCcw size={16} aria-hidden="true" />
                  <span>{t.newScan}</span>
                </button>
              </div>
            </section>
          )}

          <section
            ref={recentSectionRef}
            className={`content-grid${activeTab === 'history' ? ' history-focus' : ''}`}
            aria-labelledby="scans-heading"
          >
            <div className="main-column">
              <div className="section-heading">
                <h2 id="scans-heading">{t.recentScans}</h2>
              </div>

              {latestThree.length === 0 ? (
                <div className="empty-state" role="status">
                  {t.emptyRecent}
                </div>
              ) : (
                latestThree.map((scan) => (
                  <article key={scan.id} className="result-card">
                    <div className="scan-thumb" aria-hidden={!scan.thumbnail}>
                      {scan.thumbnail ? (
                        <img src={scan.thumbnail} alt="" />
                      ) : (
                        <Leaf size={22} aria-hidden="true" />
                      )}
                    </div>
                    <div className="result-info">
                      <strong>{t.diseaseNames[scan.name] || scan.name}</strong>
                      {showEnglishSecondary && englishNames[scan.name] && (
                        <span className="disease-name-en">{englishNames[scan.name]}</span>
                      )}
                      <span className="scan-meta">{formatScanWhen(scan)}</span>
                    </div>
                    <span className={`confidence-band band-${scan.band || 'likely'}`}>
                      {t.bands[scan.band || 'likely']}
                    </span>
                  </article>
                ))
              )}
            </div>

            <aside className="how-card" aria-labelledby="how-heading">
              <div className="how-header">
                <div className="round-icon" style={{ width: '40px', height: '40px' }} aria-hidden="true">
                  <Sparkles size={20} />
                </div>
                <h2 id="how-heading">{t.howToTitle}</h2>
              </div>
              <div className="tip-row">
                <div className="tip-icon" aria-hidden="true">
                  <Leaf size={20} />
                </div>
                <p>{t.step1}</p>
              </div>
              <div className="tip-row">
                <div className="tip-icon" aria-hidden="true">
                  <Sun size={20} />
                </div>
                <p>{t.step2}</p>
              </div>
              <div className="tip-row">
                <div className="tip-icon" aria-hidden="true">
                  <Focus size={20} />
                </div>
                <p>{t.step3}</p>
              </div>
            </aside>
          </section>
        </>
      )}

      <nav className="bottom-nav" aria-label="Main">
        <button
          type="button"
          className={activeTab === 'home' ? 'nav-active' : ''}
          onClick={resetScan}
          aria-current={activeTab === 'home' ? 'page' : undefined}
          aria-label={t.home}
        >
          <Home size={22} aria-hidden="true" />
          <span>{t.home}</span>
        </button>
        <button
          type="button"
          className={activeTab === 'history' ? 'nav-active' : ''}
          onClick={goHistory}
          aria-current={activeTab === 'history' ? 'page' : undefined}
          aria-label={t.historyTab}
        >
          <History size={22} aria-hidden="true" />
          <span>{t.historyTab}</span>
        </button>
        <button
          type="button"
          className={activeTab === 'schemes' ? 'nav-active' : ''}
          onClick={() => setActiveTab('schemes')}
          aria-current={activeTab === 'schemes' ? 'page' : undefined}
          aria-label={t.schemesTab}
        >
          <Landmark size={22} aria-hidden="true" />
          <span>{t.schemesTab}</span>
        </button>
        <button
          type="button"
          className={activeTab === 'help' ? 'nav-active' : ''}
          onClick={goHelp}
          aria-current={activeTab === 'help' ? 'page' : undefined}
          aria-label={t.helpTab}
        >
          <QuestionIcon size={22} aria-hidden="true" />
          <span>{t.helpTab}</span>
        </button>
      </nav>
    </main>
  );
}
