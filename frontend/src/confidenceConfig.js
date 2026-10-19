/**
 * Configurable thresholds for AI honesty.
 * Farmers never see raw percentages.
 * - Scores >= likely_threshold: "Likely"
 * - Scores >= possible_threshold and < likely_threshold: "Possible"
 * - Scores < possible_threshold: "Not sure"
 */
export const confidenceConfig = {
  likely_threshold: 0.65,
  possible_threshold: 0.35,
};

export default confidenceConfig;
