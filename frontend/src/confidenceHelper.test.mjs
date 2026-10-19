import assert from 'assert';
import {
  getConfidenceBand,
  isLowConfidenceOrUnclear,
  isInsectPest,
  isNoDiseaseDetected,
  isConfusableCondition,
} from './confidenceHelper.js';
import confidenceConfig from './confidenceConfig.js';

console.log('--- Running Confidence & AI Honesty Tests ---');

// Test 1: Configurable thresholds
assert(typeof confidenceConfig.likely_threshold === 'number', 'likely_threshold must be a number');
assert(typeof confidenceConfig.possible_threshold === 'number', 'possible_threshold must be a number');
assert(confidenceConfig.likely_threshold > confidenceConfig.possible_threshold, 'likely > possible');
console.log('✓ Thresholds properly configured:', confidenceConfig);

// Test 2: Qualitative bands mapping (Never raw percentages)
assert.strictEqual(getConfidenceBand(0.85), 'likely', '0.85 should be likely');
assert.strictEqual(getConfidenceBand(0.50), 'possible', '0.50 should be possible');
assert.strictEqual(getConfidenceBand(0.20), 'not_sure', '0.20 should be not_sure');
console.log('✓ Qualitative bands mapped correctly without raw percentages');

// Test 3: Low confidence unclear test
assert.strictEqual(isLowConfidenceOrUnclear(0.25), true, '0.25 is unclear');
assert.strictEqual(isLowConfidenceOrUnclear(0.75), false, '0.75 is clear');
console.log('✓ Low confidence detection passed');

// Test 4: Pest vs disease distinction
assert.strictEqual(isInsectPest('Caterpillar and Semilooper Pest Attack'), true, 'Caterpillar is pest');
assert.strictEqual(isInsectPest('Soyabean_Rust'), false, 'Rust is fungal disease');
console.log('✓ Pest vs disease categorization passed');

// Test 5: Healthy plant wording
assert.strictEqual(isNoDiseaseDetected('Healthy_Soyabean'), true, 'Healthy soybean detected');
assert.strictEqual(isNoDiseaseDetected('Soyabean_Mosaic'), false, 'Mosaic is disease');
console.log('✓ No disease detected check passed');

// Test 6: Confusable fungal conditions
assert.strictEqual(isConfusableCondition('Soyabean_Rust'), true);
assert.strictEqual(isConfusableCondition('Soyabean_Frog_Leaf_Eye'), true);
assert.strictEqual(isConfusableCondition('Soyabean_Spectoria_Brown_Spot'), true);
assert.strictEqual(isConfusableCondition('Soyabean_Mosaic'), false);
console.log('✓ Confusable conditions trio identified');

console.log('--- All Confidence & AI Honesty Tests Passed! ---');
