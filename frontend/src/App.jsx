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
  Sparkles,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
} from 'lucide-react';
import { translations } from './translations';
import { diagnoseCropImage, checkBackendHealth } from './apiService';

export default function App() {
  const [lang, setLang] = useState('hi');
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [activeRemedyTab, setActiveRemedyTab] = useState('chemical');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [recentScans, setRecentScans] = useState(() => {
    try {
      const saved = localStorage.getItem('agrocure_scans');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          name: 'Soyabean_Rust',
          crop: 'सोयाबीन',
          time: 'आज, 10:42 AM',
          confidence: 88,
          healthy: false,
        },
        {
          id: '2',
          name: 'Healthy_Soyabean',
          crop: 'सोयाबीन',
          time: 'कल, 4:18 PM',
          confidence: 96,
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

  // Check backend health periodically
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

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setLoading(true);
    setShowHeatmap(false);

    try {
      const result = await diagnoseCropImage(file);
      setDiagnosis(result);

      // Save to recent scans
      const newScan = {
        id: Date.now().toString(),
        name: result.diagnosis.predicted_class,
        crop: lang === 'en' ? 'Soybean' : 'सोयाबीन',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: Math.round(result.diagnosis.confidence * 100),
        healthy: result.diagnosis.predicted_class === 'Healthy_Soyabean',
      };

      setRecentScans((prev) => {
        const updated = [newScan, ...prev.slice(0, 4)];
        localStorage.setItem('agrocure_scans', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error(err);
      setError(err.message || t.errorConnecting);
    } finally {
      setLoading(false);
    }
  };

  // Text to Speech
  const speakDiagnosis = () => {
    if (!diagnosis || !('speechSynthesis' in window)) return;
    const diseaseName = t.diseaseNames[diagnosis.diagnosis.predicted_class] || diagnosis.diagnosis.predicted_class;
    let textToSpeak = `${t.diagnosisResult}: ${diseaseName}. `;
    if (diagnosis.remedy.chemical?.medicine) {
      textToSpeak += `${t.chemicalTab}: ${diagnosis.remedy.chemical.medicine}. `;
    }
    if (diagnosis.remedy.organic?.solution) {
      textToSpeak += `${t.organicTab}: ${diagnosis.remedy.organic.solution}.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const resetScan = () => {
    setImageFile(null);
    setImagePreview(null);
    setDiagnosis(null);
    setError(null);
    setShowHeatmap(false);
  };

  return (
    <main className="agro-shell">
      {/* Top Header */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Leaf size={22} strokeWidth={2.4} />
          </span>
          <span>
            Agro<span>Cure</span>
          </span>
        </div>

        <div className="top-actions">
          <div className="language-toggle" role="group">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
              EN
            </button>
            <button className={lang === 'hi' ? 'active' : ''} onClick={() => setLang('hi')}>
              हिंदी
            </button>
            <button className={lang === 'mr' ? 'active' : ''} onClick={() => setLang('mr')}>
              मराठी
            </button>
          </div>
        </div>
      </header>

      {/* Greeting Banner */}
      <section className="welcome-row">
        <div>
          <p className="eyebrow">
            {t.offlineReady}{' '}
            <span className={`status-dot ${isBackendOnline ? '' : 'disconnected'}`}></span>
          </p>
          <h1>{t.greeting}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="avatar">क</div>
      </section>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Scan / Action Card */}
      {!diagnosis && !loading && (
        <section className="scan-card">
          <div className="scan-copy">
            <div className="round-icon">
              <Camera size={24} />
            </div>
            <div>
              <h2>{t.scanTitle}</h2>
              <p>{t.scanSubtitle}</p>
            </div>
          </div>

          <div className="scan-actions">
            <button className="primary-button" onClick={() => cameraInputRef.current?.click()}>
              <Camera size={19} />
              {t.openCamera}
            </button>
            <button className="secondary-button" onClick={() => fileInputRef.current?.click()}>
              <FileText size={18} />
              {t.choosePhoto}
            </button>
          </div>

          <div className="secure-note">
            <ShieldCheck size={16} />
            {t.secureNote}
          </div>
        </section>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="result-container spinner-container">
          <div className="spinner"></div>
          <p style={{ fontWeight: 700, color: '#2d5a27' }}>{t.diagnosing}</p>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Analyzing"
              style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px' }}
            />
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#b91c1c',
          }}
        >
          <AlertCircle size={20} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* Live Diagnosis Result View */}
      {diagnosis && !loading && (
        <section className="result-container">
          <div className="result-header">
            <div className="result-title-group">
              <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2d5a27', textTransform: 'uppercase' }}>
                {t.diagnosisResult}
              </p>
              <h3>
                {t.diseaseNames[diagnosis.diagnosis.predicted_class] || diagnosis.diagnosis.predicted_class}
              </h3>
              <p className="result-latin">{diagnosis.diagnosis.predicted_class}</p>
            </div>

            <div className="confidence-badge">
              <span className="confidence-val">{Math.round(diagnosis.diagnosis.confidence * 100)}%</span>
              <span
                className={`confidence-band band-${diagnosis.diagnosis.confidence_band.toLowerCase()}`}
              >
                {diagnosis.diagnosis.confidence_band}
              </span>
            </div>
          </div>

          {/* Leaf & GradCAM Heatmap Toggle */}
          <div className="image-inspection">
            <div className="image-frame">
              <img
                src={showHeatmap ? diagnosis.diagnosis.gradcam_heatmap_url : imagePreview}
                alt="Leaf scan"
              />
            </div>
            <button className="toggle-view-btn" onClick={() => setShowHeatmap(!showHeatmap)}>
              <Eye size={15} />
              {showHeatmap ? 'मूल पत्ती देखें' : t.gradcamToggle}
            </button>
          </div>

          {/* Top 3 Candidates */}
          <div className="candidates-section">
            <h4>{t.topCandidates}</h4>
            {diagnosis.diagnosis.top3_classes.map((cand, idx) => (
              <div key={idx} className="candidate-row">
                <div className="candidate-labels">
                  <span>{t.diseaseNames[cand.class_name] || cand.class_name}</span>
                  <span>{Math.round(cand.confidence * 100)}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.round(cand.confidence * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Agronomic Remedies Tabs */}
          <div className="remedies-section">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px' }}>
              {t.remediesTitle}
            </h4>

            <div className="remedies-nav">
              <button
                className={`remedy-tab-btn ${activeRemedyTab === 'chemical' ? 'active' : ''}`}
                onClick={() => setActiveRemedyTab('chemical')}
              >
                {t.chemicalTab}
              </button>
              <button
                className={`remedy-tab-btn ${activeRemedyTab === 'organic' ? 'active' : ''}`}
                onClick={() => setActiveRemedyTab('organic')}
              >
                {t.organicTab}
              </button>
              <button
                className={`remedy-tab-btn ${activeRemedyTab === 'cultural' ? 'active' : ''}`}
                onClick={() => setActiveRemedyTab('cultural')}
              >
                {t.culturalTab}
              </button>
            </div>

            <div className="remedy-card-content">
              {activeRemedyTab === 'chemical' && (
                <div>
                  <div className="remedy-item">
                    <strong>दवा / Medicine</strong>
                    <p>{diagnosis.remedy.chemical?.medicine}</p>
                  </div>
                  <div className="remedy-item">
                    <strong>{t.dosage}</strong>
                    <p>{diagnosis.remedy.chemical?.dosage}</p>
                  </div>
                  <div className="remedy-badges">
                    <span className="remedy-pill">
                      ⏳ {t.safetyInterval}: {diagnosis.remedy.chemical?.safety_interval_days} {t.days}
                    </span>
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
                  <strong>खेत प्रबंधन / Cultural Guidelines</strong>
                  <p>{diagnosis.remedy.cultural}</p>
                </div>
              )}
            </div>
          </div>

          {/* Audio Speech & Reset Scan */}
          <div className="actions-footer">
            <button className="audio-btn" onClick={speakDiagnosis}>
              <Volume2 size={18} />
              {t.listenVoice}
            </button>
            <button className="reset-btn" onClick={resetScan}>
              <RotateCcw size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {t.newScan}
            </button>
          </div>
        </section>
      )}

      {/* Recent Scans Section */}
      <section className="content-grid">
        <div className="main-column">
          <div className="section-heading">
            <h2>{t.recentScans}</h2>
            <button
              style={{ background: 'none', border: 'none', color: '#2d5a27', fontWeight: 700, cursor: 'pointer' }}
            >
              {t.viewAll}
              <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>

          {recentScans.map((scan) => (
            <div key={scan.id} className="result-card">
              <div className={`mini-leaf ${scan.healthy ? 'healthy' : ''}`}>
                <Leaf size={24} />
              </div>
              <div className="result-info">
                <strong>{t.diseaseNames[scan.name] || scan.name}</strong>
                <span>{scan.crop} · {scan.time}</span>
              </div>
              <div className="confidence-chip">{scan.confidence}%</div>
            </div>
          ))}
        </div>

        {/* How to take good photo Guide */}
        <aside className="how-card">
          <div className="how-header">
            <div className="round-icon" style={{ width: '36px', height: '36px' }}>
              <Sparkles size={18} />
            </div>
            <h2>{t.howToTitle}</h2>
          </div>
          <div className="step">
            <span>1</span>
            <p>{t.step1}</p>
            <Check size={16} className="step-check" />
          </div>
          <div className="step">
            <span>2</span>
            <p>{t.step2}</p>
            <Check size={16} className="step-check" />
          </div>
          <div className="step">
            <span>3</span>
            <p>{t.step3}</p>
            <Check size={16} className="step-check" />
          </div>
        </aside>
      </section>

      {/* Bottom Sticky Nav */}
      <nav className="bottom-nav">
        <button className="nav-active" onClick={resetScan}>
          <Home size={20} />
          <span>{t.home}</span>
        </button>
        <button onClick={() => cameraInputRef.current?.click()}>
          <History size={20} />
          <span>{t.diagnoseTab}</span>
        </button>
        <button onClick={() => alert('AgroCure Support: Helpline 1800-180-1551 (Kisan Call Center)')}>
          <HelpCircle size={20} />
          <span>{t.helpTab}</span>
        </button>
      </nav>
    </main>
  );
}
