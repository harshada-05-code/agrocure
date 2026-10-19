import assert from 'assert';
import { GOVERNMENT_SCHEMES } from './schemes.data.js';

console.log('--- Running Government Schemes Honesty Tests ---');

assert(Array.isArray(GOVERNMENT_SCHEMES), 'Schemes should be an array');
assert(GOVERNMENT_SCHEMES.length >= 2, 'Should have multiple verified schemes');

for (const scheme of GOVERNMENT_SCHEMES) {
  assert(scheme.id, 'Scheme must have an id');
  assert(scheme.name.en && scheme.name.hi && scheme.name.mr, 'Scheme must have EN, HI, MR names');
  assert(scheme.last_checked, 'Scheme must have last_checked date');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(scheme.last_checked), 'last_checked must be in YYYY-MM-DD format');
  assert(typeof scheme.verified === 'boolean', 'Scheme must have boolean verified flag');

  if (!scheme.verified) {
    assert(
      scheme.eligibility.en.toLowerCase().includes('verified') ||
      scheme.eligibility.hi.includes('सत्यापित') ||
      scheme.eligibility.mr.includes('पडताळणी'),
      'Unverified scheme must display details being verified notice'
    );
  }
}

console.log(`✓ All ${GOVERNMENT_SCHEMES.length} government schemes passed data honesty checks!`);
