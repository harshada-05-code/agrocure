const assert = require('assert');
const { REMEDIES_DATABASE, getRemedyForCondition } = require('./dist/diagnose/remedies.data.js');

console.log('--- Running Agronomic Remedy & Pesticide Safety Tests ---');

for (const [key, remedy] of Object.entries(REMEDIES_DATABASE)) {
  console.log(`Checking safety for: ${key}`);
  assert(remedy.category, `Remedy must have a category (disease, pest, healthy): ${key}`);

  // Test: No exact dosages with ml/acre or g/acre
  const dosage = remedy.chemical.dosage.toLowerCase();
  assert(
    !dosage.includes('ml per acre') && !dosage.includes('grams per acre') && !dosage.includes('g/l'),
    `Dosage must NOT contain specific numbers/rates (must follow label strictly): ${key} -> ${remedy.chemical.dosage}`
  );

  // Test: Mandatory safety notice on chemical remedies
  assert(
    remedy.chemical.safety_notice && remedy.chemical.safety_notice.length > 10,
    `Must include mandatory safety notice on: ${key}`
  );
}

// Test: Caterpillar is categorized as pest
const caterpillar = getRemedyForCondition('Caterpillar and Semilooper Pest Attack');
assert.strictEqual(caterpillar.category, 'pest', 'Caterpillar must be categorized as pest');

// Test: Healthy leaf
const healthy = getRemedyForCondition('Healthy_Soyabean');
assert.strictEqual(healthy.category, 'healthy', 'Healthy soybean must be category healthy');
assert(healthy.chemical.medicine.includes('No chemical treatment needed'), 'Healthy crop must not prescribe chemicals');

console.log('✓ All agronomic remedies passed pesticide safety compliance!');
