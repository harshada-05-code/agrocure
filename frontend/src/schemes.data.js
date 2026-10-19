/**
 * Verified Government Agricultural Support & Insurance Schemes.
 * As per AI honesty guidelines:
 * - Facts are read strictly from this file (never invented).
 * - Displays "Last checked: <date>" and a mandatory "confirm at your agriculture office" note.
 * - Entries with verified: false show "Details being verified" instead of unconfirmed claims.
 */

export const GOVERNMENT_SCHEMES = [
  {
    id: "pmfby",
    name: {
      en: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      hi: "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
      mr: "प्रधानमंत्री पीक विमा योजना (PMFBY)",
    },
    shortSummary: {
      en: "Financial support for crop loss caused by unpreventable natural pests and localized plant diseases.",
      hi: "प्राकृतिक आपदाओं, कीटों और स्थानीय फसल रोगों से होने वाले नुकसान पर आर्थिक सहायता।",
      mr: "नैसर्गिक आपत्ती, कीड व रोगांमुळे होणाऱ्या सोयाबीन पिकाच्या नुकसानीवर विमा संरक्षण.",
    },
    eligibility: {
      en: "All soybean-growing farmers who have enrolled their crop on the PMFBY portal within the designated cut-off date.",
      hi: "वे सभी सोयाबीन उत्पादक किसान जिन्होंने निर्धारित तिथि के भीतर पीएमएफबीवाई पोर्टल पर अपनी फसल का पंजीकरण कराया है।",
      mr: "विहित मुदतीत पीएमएफबीवाय पोर्टलवर नोंदणी केलेले सर्व सोयाबीन उत्पादक शेतकरी.",
    },
    last_checked: "2026-09-15",
    verified: true,
    actionAdvice: {
      en: "Intimate crop loss within 72 hours via the Crop Insurance App or at your local bank / Agriculture Office.",
      hi: "फसल नुकसान होने के 72 घंटे के भीतर क्रॉप इंश्योरेंस ऐप या नजदीकी बैंक/कृषि कार्यालय में सूचित करें।",
      mr: "नुकसान झाल्यापासून ७२ तासांच्या आत क्रॉप इन्शुरन्स ॲप किंवा स्थानिक बँक/कृषी कार्यालयात तक्रार नोंदवा.",
    },
  },
  {
    id: "biocontrol-subsidy",
    name: {
      en: "Sub-Mission on Plant Protection (Bio-Agent & IPM Subsidy)",
      hi: "पादप संरक्षण उप-मिशन (जैविक कीटनाशक एवं फेरोमोन ट्रैप अनुदान)",
      mr: "वनस्पती संरक्षण उप-अभियान (जैविक नियंत्रक व ट्रॅप्स अनुदान)",
    },
    shortSummary: {
      en: "Assistance on pheromone traps, light traps, and Trichoderma bio-agents for integrated pest management in soybean.",
      hi: "सोयाबीन में एकीकृत कीट प्रबंधन हेतु फेरोमोन ट्रैप और ट्राइकोडर्मा जैसे जैव-कारकों पर विभागीय सहायता।",
      mr: "सोयाबीन कीड व्यवस्थापनासाठी कामगंध सापळे आणि ट्रायकोडर्मा यांसारख्या जैविक घटकांसाठी साहाय्य.",
    },
    eligibility: {
      en: "Small and marginal farmers holding verified land revenue records (7/12 or Khasra).",
      hi: "सत्यापित भूमि रिकॉर्ड (खसरा / खतौनी) धारक लघु एवं सीमांत किसान।",
      mr: "७/१२ उतारा असलेले लहान व अल्पभूधारक शेतकरी.",
    },
    last_checked: "2026-08-20",
    verified: true,
    actionAdvice: {
      en: "Apply through your state DBT agriculture portal or consult your Gram Sevak / Taluka Agriculture Officer.",
      hi: "राज्य डीबीटी कृषि पोर्टल के माध्यम से आवेदन करें या अपने ग्राम सेवक / कृषि सहायक से संपर्क करें।",
      mr: "महाडीबीटी / राज्य कृषी पोर्टलवरून अर्ज करा किंवा कृषी सहाय्यकांशी संपर्क साधा.",
    },
  },
  {
    id: "state-pest-emergency-support",
    name: {
      en: "State Specialized Pest Outbreak Relief",
      hi: "राज्य विशेष कीट प्रकोप राहत योजना",
      mr: "राज्यस्तरीय कीड प्रादुर्भाव विशेष मदत",
    },
    shortSummary: {
      en: "Contingency support provided during epidemic-scale Yellow Mosaic or Semilooper attacks.",
      hi: "पीला मोज़ेक या बड़े पैमाने पर कीट प्रकोप के समय आपातकालीन राज्य सहायता।",
      mr: "मोठ्या प्रमाणावर तांबेरा किंवा लष्करी अळीच्या प्रादुर्भावासाठी संभाव्य साहाय्य.",
    },
    eligibility: {
      en: "Details being verified with state directorates.",
      hi: "राज्य कृषि निदेशालय से विवरण सत्यापित किए जा रहे हैं।",
      mr: "राज्य कृषी विभागाकडून तपशील पडताळणी सुरू आहे.",
    },
    last_checked: "2026-10-01",
    verified: false, // Flagged unverified - must show 'details being verified'
    actionAdvice: {
      en: "Contact your local District Agriculture Superintendent (SDAO) for current active notifications.",
      hi: "वर्तमान सक्रिय अधिसूचनाओं के लिए अपने जिला कृषि अधीक्षक (SDAO) से संपर्क करें।",
      mr: "सद्यस्थितीतील शासन निर्णयांसाठी तालुका कृषी अधिकाऱ्यांशी संपर्क साधा.",
    },
  },
];

export default GOVERNMENT_SCHEMES;
