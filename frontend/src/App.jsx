import React, { useState, useEffect, useRef } from 'react';
import {
  Leaf,
  Camera,
  FileText,
  Home,
  History,
  FileCheck,
  HelpCircle,
  Sun,
  Type,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle as QuestionIcon,
  PhoneCall,
} from 'lucide-react';
import { translations } from './translations';
import { diagnoseCropImage } from './apiService';
import { compressLeafImage } from './imageCompressor';
import GradCamOverlay from './components/GradCamOverlay';
import VoiceGuide from './components/VoiceGuide';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('agrocure_lang') || 'en');
  const [largeText, setLargeText] = useState(() => localStorage.getItem('agrocure_font_size') === 'large');
  const [sunlightMode, setSunlightMode] = useState(() => localStorage.getItem('agrocure_sunlight') === 'true');
  const [activeTab, setActiveTab] = useState('home');

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('All');

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const t = translations[lang] || translations.en;

  const [recentScans, setRecentScans] = useState(() => {
    try {
      const saved = localStorage.getItem('agrocure_scans');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          name: 'Soyabean Rust',
          date: '19 Oct 2026',
          time: '10:24 PM',
          band: 'Likely',
          bandClass: 'likely',
          thumb: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a2e?w=120&auto=format&fit=crop&q=80',
        },
      ];
    } catch {
      return [];
    }
  });

  // Schemes Questionnaire State (6 steps + Step 7 results)
  const [schemeStep, setSchemeStep] = useState(1);
  const [schemeForm, setSchemeForm] = useState({
    state: 'Maharashtra',
    landSize: 'Under 1 hectare',
    landOwned: 'Yes',
    crop: 'Soybean',
    category: 'General',
    isWoman: 'No',
    docs: { bankAadhaar: true, mobileAadhaar: true, land712: true },
  });

  useEffect(() => {
    document.body.classList.toggle('large-text-mode', largeText);
    localStorage.setItem('agrocure_font_size', largeText ? 'large' : 'normal');
  }, [largeText]);

  useEffect(() => {
    document.body.classList.toggle('sunlight-mode', sunlightMode);
    localStorage.setItem('agrocure_sunlight', sunlightMode ? 'true' : 'false');
  }, [sunlightMode]);

  useEffect(() => {
    localStorage.setItem('agrocure_lang', lang);
  }, [lang]);

  const processImageFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setShowHeatmap(false);

    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const readyFile = await compressLeafImage(file, 800, 0.78);
      const result = await diagnoseCropImage(readyFile);
      setDiagnosis(result);

      const rawClass = result.diagnosis?.predicted_class || 'Healthy_Soyabean';
      const commonName = t.diseaseNames?.[rawClass] || rawClass.replace(/_/g, ' ');
      const conf = result.diagnosis?.confidence ?? 0.85;
      const bandClass = conf >= 0.8 ? 'likely' : conf >= 0.5 ? 'possible' : 'notsure';
      const bandName = t.bands?.[bandClass] || (bandClass === 'likely' ? 'Likely' : bandClass === 'possible' ? 'Possible' : 'Not sure');

      const now = new Date();
      const newScan = {
        id: Date.now().toString(),
        name: commonName,
        date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        band: bandName,
        bandClass: bandClass,
        thumb: previewUrl,
      };

      setRecentScans((prev) => {
        const updated = [newScan, ...prev];
        localStorage.setItem('agrocure_scans', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };
   const voiceText = React.useMemo(() => {
    if (!diagnosis) {
      return lang === 'mr'
        ? 'नमस्कार शेतकरी बंधूंनो, तुमच्या सोयाबीन पानाचा फोटो काढा किंवा अपलोड करा.'
        : lang === 'hi'
        ? 'नमस्कार किसान भाइयों, अपनी सोयाबीन पत्ती की फोटो लें या अपलोड करें।'
        : 'Welcome farmer, please take or upload a soybean leaf photo.';
    }
    const predClass = diagnosis.diagnosis?.predicted_class || 'Leaf Disease';
    return `${t.greeting}. Diagnosis: ${predClass.replace(/_/g, ' ')}.`;
  }, [diagnosis, lang, t]);

  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="top-header">
        <div className="brand-title">
          <div className="brand-logo">
            <Leaf size={18} color="#ffffff" />
          </div>
          <span className="brand-name">AgroCure</span>
        </div>

        <div className="header-actions">
          <div className="lang-pill">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'hi' ? 'active' : ''} onClick={() => setLang('hi')}>हिं</button>
            <button className={lang === 'mr' ? 'active' : ''} onClick={() => setLang('mr')}>मरा</button>
          </div>

          <VoiceGuide
            text={voiceText}
            lang={lang}
            labelPlay={lang === 'mr' ? 'ऐका' : lang === 'hi' ? 'सुनिए' : 'Listen'}
            labelStop={lang === 'mr' ? 'थांबा' : lang === 'hi' ? 'रोकें' : 'Stop'}
          />

          <button className="a11y-pill-btn" onClick={() => setLargeText(!largeText)} aria-label="Toggle text size">
            <Type size={14} />
            <span>Text</span>
          </button>

          <button className="a11y-pill-btn" onClick={() => setSunlightMode(!sunlightMode)} aria-label="Toggle sunlight mode">
            <Sun size={14} />
            <span>Sun</span>
          </button>
        </div>
      </header>

      {/* Hidden File Upload Triggers */}
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileInputChange} />
      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileInputChange} />

      {/* Main Content */}
      <main className="main-content">
        {/* PAGE 1: HOME */}
        {activeTab === 'home' && (
          <div className="tab-page home-page">
            {!diagnosis && !loading ? (
              <>
                <section className="welcome-banner">
                  <h1>{t.greeting}</h1>
                  <p>{t.subtitle}</p>
                </section>

                <div className="notice-banner">
                  <Leaf size={18} className="notice-icon" />
                  <span>{t.soybeanOnly}</span>
                </div>

                <div className="action-buttons-group">
                  <button className="btn-primary-green" onClick={() => cameraInputRef.current?.click()}>
                    <Camera size={20} />
                    <span>{t.openCamera}</span>
                  </button>

                  <button className="btn-outline-green" onClick={() => fileInputRef.current?.click()}>
                    <FileText size={20} />
                    <span>{t.choosePhoto}</span>
                  </button>
                </div>

                <section className="guide-card">
                  <h2>{t.howToTitle}</h2>
                  <div className="guide-step">
                    <div className="step-icon"><Sun size={18} /></div>
                    <p>{t.step1}</p>
                  </div>
                  <div className="guide-step">
                    <div className="step-icon"><Leaf size={18} /></div>
                    <p>{t.step2}</p>
                  </div>
                </section>
              </>
            ) : loading ? (
              <div className="loading-box">
                <p>{t.analyzing || 'Analyzing leaf image...'}</p>
              </div>
            ) : (
              <section className="diagnosis-results-card">
                <button className="back-link" onClick={() => setDiagnosis(null)}>
                  <ArrowLeft size={16} /> {t.backToScanner || 'Back to scanner'}
                </button>

                {(() => {
                  const predClass = diagnosis.diagnosis?.predicted_class || 'Healthy_Soyabean';
                  const conf = diagnosis.diagnosis?.confidence ?? 0.85;
                  const bandKey = conf >= 0.8 ? 'likely' : conf >= 0.5 ? 'possible' : 'notsure';
                  const bandText = t.bands?.[bandKey] || (bandKey === 'likely' ? 'Likely' : bandKey === 'possible' ? 'Possible' : 'Not sure');
                  const diseaseLabel = t.diseaseNames?.[predClass] || predClass.replace(/_/g, ' ');

                  return (
                    <div className="result-header">
                      <h3>{diseaseLabel}</h3>
                      <span className={`confidence-pill ${bandKey}`}>{bandText}</span>
                    </div>
                  );
                })()}

                <div className="image-preview-frame">
                  {showHeatmap ? (
                    <GradCamOverlay imageSrc={imagePreview} />
                  ) : (
                    <img src={imagePreview} alt="Leaf preview" />
                  )}
                  <button className="heatmap-toggle-btn" onClick={() => setShowHeatmap(!showHeatmap)}>
                    {showHeatmap ? (t.viewOriginal || 'View original photo') : (t.viewHeatmap || 'View Grad-CAM Heatmap')}
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* PAGE 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="tab-page history-page">
            <section className="page-header">
              <h1>{t.historyTitle}</h1>
              <p>{t.historySub}</p>
            </section>

            <div className="filter-chips-row">
              <span className="filter-label">{t.filterLabel}</span>
              <div className="chips-container">
                {[t.filters.all, t.filters.today, t.filters.days7, t.filters.month].map((chip) => (
                  <button
                    key={chip}
                    className={`chip-btn ${historyFilter === chip ? 'active' : ''}`}
                    onClick={() => setHistoryFilter(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="scan-history-list">
              {recentScans.map((scan) => (
                <div key={scan.id} className="history-card">
                  {scan.thumb ? (
                    <img src={scan.thumb} alt={scan.name} className="history-thumb" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="history-thumb-placeholder"><Leaf size={20} /></div>
                  )}
                  <div className="history-details">
                    <h3>{scan.name}</h3>
                    <span className="history-timestamp">{scan.date} · {scan.time}</span>
                  </div>
                  <div className={`status-badge ${scan.bandClass}`}>
                    {scan.bandClass === 'likely' && <CheckCircle2 size={12} />}
                    {scan.bandClass === 'possible' && <AlertTriangle size={12} />}
                    {scan.bandClass === 'notsure' && <QuestionIcon size={12} />}
                    <span>{scan.band}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* PAGE 3: SCHEMES (Multilingual Questionnaire) */}
{activeTab === 'schemes' && (
  <div className="tab-page schemes-page">
    <div className="questionnaire-progress-bar">
      <div className="progress-fill" style={{ width: `${(schemeStep / 6) * 100}%` }}></div>
    </div>

    <div className="step-nav-header">
      {schemeStep > 1 && (
        <button className="step-back-btn" onClick={() => setSchemeStep((s) => s - 1)}>
          <ArrowLeft size={16} /> {t.schemes.back}
        </button>
      )}
      {schemeStep <= 5 && (
        <span className="step-count">
          {t.schemes.question} {schemeStep} / 5
        </span>
      )}
    </div>

    {/* Step 1: State Selection */}
    {schemeStep === 1 && (
      <div className="question-card">
        <h2>{t.schemes.q1Title}</h2>
        <p className="question-sub">{t.schemes.q1Sub}</p>

        <label className="input-label">{t.schemes.chooseState}</label>
        <select
          className="custom-select"
          value={schemeForm.state}
          onChange={(e) => setSchemeForm({ ...schemeForm, state: e.target.value })}
        >
          <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
          <option value="Madhya Pradesh">Madhya Pradesh (मध्य प्रदेश)</option>
          <option value="Rajasthan">Rajasthan (राजस्थान)</option>
          <option value="Gujarat">Gujarat (गुजरात)</option>
          <option value="Karnataka">Karnataka (कर्नाटक)</option>
        </select>
        <span className="field-hint">{t.schemes.stateHint}</span>

        <button className="btn-primary-green next-btn" onClick={() => setSchemeStep(2)}>
          {t.schemes.next} <ArrowRight size={18} />
        </button>
      </div>
    )}

    {/* Step 2: Land Size & Ownership */}
{schemeStep === 2 && (
  <div className="question-card">
    <h2>{t.schemes.q2Title}</h2>
    <div className="radio-options-group">
      {t.schemes.landSize.map((opt, idx) => (
        <label key={idx} className={`radio-card ${schemeForm.landSize === opt ? 'selected' : ''}`}>
          <input
            type="radio"
            name="landSize"
            checked={schemeForm.landSize === opt}
            onChange={() => setSchemeForm({ ...schemeForm, landSize: opt })}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>

    <h3 className="section-subheading">{t.schemes.q2SubTitle}</h3>
    <div className="radio-options-group">
      {t.schemes.yesNo.map((opt, idx) => (
        <label key={idx} className={`radio-card ${schemeForm.landOwned === opt ? 'selected' : ''}`}>
          <input
            type="radio"
            name="landOwned"
            checked={schemeForm.landOwned === opt}
            onChange={() => setSchemeForm({ ...schemeForm, landOwned: opt })}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>

    <button className="btn-primary-green next-btn" onClick={() => setSchemeStep(3)}>
      {t.schemes.next} <ArrowRight size={18} />
    </button>
  </div>
)}

    {/* Step 3: Crop Selection */}
    {schemeStep === 3 && (
      <div className="question-card">
        <h2>{t.schemes.q3Title}</h2>
        <div className="radio-options-group">
          {t.schemes.crops.map((crop, idx) => (
            <label key={idx} className={`radio-card ${schemeForm.crop === crop ? 'selected' : ''}`}>
              <input
                type="radio"
                name="crop"
                checked={schemeForm.crop === crop}
                onChange={() => setSchemeForm({ ...schemeForm, crop })}
              />
              <span>{crop}</span>
            </label>
          ))}
        </div>

        <button className="btn-primary-green next-btn" onClick={() => setSchemeStep(4)}>
          {t.schemes.next} <ArrowRight size={18} />
        </button>
      </div>
    )}

    {/* Step 4: Social Category & Gender */}
    {schemeStep === 4 && (
      <div className="question-card">
        <h2>{t.schemes.q4Title}</h2>
        <div className="radio-options-group">
          {t.schemes.categories.map((cat, idx) => (
            <label key={idx} className={`radio-card ${schemeForm.category === cat ? 'selected' : ''}`}>
              <input
                type="radio"
                name="category"
                checked={schemeForm.category === cat}
                onChange={() => setSchemeForm({ ...schemeForm, category: cat })}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>

        <h3 className="section-subheading">{t.schemes.q4SubTitle}</h3>
        <div className="radio-options-group">
          {t.schemes.yesNo.map((opt, idx) => (
            <label key={idx} className={`radio-card ${schemeForm.isWoman === opt ? 'selected' : ''}`}>
              <input
                type="radio"
                name="isWoman"
                checked={schemeForm.isWoman === opt}
                onChange={() => setSchemeForm({ ...schemeForm, isWoman: opt })}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        <button className="btn-primary-green next-btn" onClick={() => setSchemeStep(5)}>
          {t.schemes.next} <ArrowRight size={18} />
        </button>
      </div>
    )}

    {/* Step 5: Document Checkboxes */}
    {schemeStep === 5 && (
      <div className="question-card">
        <h2>{t.schemes.q5Title}</h2>
        <p className="question-sub">{t.schemes.q5Sub}</p>

        <div className="checkbox-options-group">
          {t.schemes.docs.map((docText, idx) => (
            <label key={idx} className="checkbox-card">
              <input
                type="checkbox"
                defaultChecked={true}
              />
              <span>{docText}</span>
            </label>
          ))}
        </div>

        <button className="btn-primary-green next-btn" onClick={() => setSchemeStep(6)}>
          {t.schemes.showSchemes} <ArrowRight size={18} />
        </button>
      </div>
    )}

    {/* Step 6: Matched Government Schemes View */}
    {schemeStep === 6 && (
      <div className="matched-schemes-view">
        <h2>{t.schemes.eligibleTitle}</h2>
        <p className="question-sub">
          {t.schemes.eligibleSub} <strong>{schemeForm.state}</strong>
        </p>

        <article className="eligible-scheme-card">
          <div className="scheme-title-row">
            <h3>{t.schemes.scheme1Title}</h3>
            <span className="verified-badge">✓ {t.schemes.verified}</span>
          </div>
          <p className="scheme-desc">{t.schemes.scheme1Desc}</p>
          <div className="advice-pill">
            <strong>{t.schemes.action}</strong> {t.schemes.scheme1Action}
          </div>
        </article>

        <button className="btn-outline-green" onClick={() => setSchemeStep(1)}>
          {t.schemes.retake}
        </button>
      </div>
    )}
  </div>
)}

        {/* PAGE 4: HELP */}
        {activeTab === 'help' && (
          <div className="tab-page help-page">
            <section className="page-header">
              <h1>{t.helpTitle}</h1>
              <p>{t.helpSub}</p>
            </section>

            <div className="help-card primary-help">
              <PhoneCall size={28} className="help-icon" />
              <div>
                <h3>{t.kisanCenter}</h3>
                <p>{t.kisanHelpline}</p>
                <a href="tel:18001801551" className="phone-number">1800-180-1551</a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navbar */}
      <nav className="bottom-navbar" aria-label="Main Navigation">
        <button className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} />
          <span>{t.nav.home}</span>
        </button>

        <button className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={22} />
          <span>{t.nav.history}</span>
        </button>

        <button className={`nav-tab-btn ${activeTab === 'schemes' ? 'active' : ''}`} onClick={() => setActiveTab('schemes')}>
          <FileCheck size={22} />
          <span>{t.nav.schemes}</span>
        </button>

        <button className={`nav-tab-btn ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
          <HelpCircle size={22} />
          <span>{t.nav.help}</span>
        </button>
      </nav>
    </div>
  );
}
