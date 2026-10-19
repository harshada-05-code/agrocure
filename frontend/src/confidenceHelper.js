import confidenceConfig from './confidenceConfig.js';

/**
 * Returns qualitative band: 'likely' | 'possible' | 'not_sure'
 * NEVER returns raw numeric percentages to farmers.
 */
export function getConfidenceBand(score) {
  const num = typeof score === 'number' ? score : parseFloat(score) || 0;
  if (num >= confidenceConfig.likely_threshold) {
    return 'likely';
  }
  if (num >= confidenceConfig.possible_threshold) {
    return 'possible';
  }
  return 'not_sure';
}

/**
 * Checks if the primary diagnosis is too low/uncertain to give a firm verdict.
 */
export function isLowConfidenceOrUnclear(topScore) {
  const num = typeof score === 'number' ? topScore : parseFloat(topScore) || 0;
  return num < confidenceConfig.possible_threshold;
}

/**
 * Checks if condition is an insect pest rather than a fungal/viral disease.
 */
export function isInsectPest(className) {
  return className === 'Caterpillar and Semilooper Pest Attack';
}

/**
 * Checks if condition indicates no disease detected.
 */
export function isNoDiseaseDetected(className) {
  return className === 'Healthy_Soyabean';
}

/**
 * Confusable fungal foliar diseases that require differential diagnosis warnings.
 */
export const CONFUSABLE_CLASSES = [
  'Soyabean_Rust',
  'Soyabean_Frog_Leaf_Eye',
  'Soyabean_Spectoria_Brown_Spot',
];

export function isConfusableCondition(className) {
  return CONFUSABLE_CLASSES.includes(className);
}

export function getDifferentialDiagnosisNote(className, t) {
  if (!isConfusableCondition(className)) return null;
  return t.differentialNotes?.[className] || null;
}
