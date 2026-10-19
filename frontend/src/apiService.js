/**
 * AgroCure Frontend API Service
 * Connects to NestJS Gateway at VITE_API_URL (default: http://localhost:3000)
 *
 * Graceful degradation: if backend is unreachable, returns a structured
 * mock diagnosis instead of surfacing raw "Failed to fetch" errors.
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

// Timeout helper (ms)
function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// Structured mock used when backend is unreachable
function _buildMockDiagnosis() {
  return {
    _isMockFallback: true,
    success: true,
    timestamp: new Date().toISOString(),
    diagnosis: {
      predicted_class: 'Soyabean_Rust',
      confidence: 0.52,
      confidence_band: 'MODERATE',
      top3_classes: [
        { class_name: 'Soyabean_Rust', confidence: 0.52 },
        { class_name: 'Soyabean_Spectoria_Brown_Spot', confidence: 0.28 },
        { class_name: 'Soyabean_Frog_Leaf_Eye', confidence: 0.12 },
      ],
      gradcam_heatmap_url: '',
      model_type: 'offline_demo',
    },
    remedy: {
      chemical: {
        medicine: 'Refer to your local agriculture office for approved fungicide',
        safety_notice: 'Read product label, wear protective gear, consult KVK.',
      },
      organic: {
        solution: 'Use neem-based biopesticide. Consult KVK for preparation details.',
      },
      cultural:
        'Remove and dispose of infected leaves. Improve field drainage. Practice 3-year crop rotation.',
    },
  };
}

export async function checkBackendHealth() {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/health`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      5000
    );
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('[AgroCure] Backend health check failed:', error.message);
    throw error;
  }
}

export async function diagnoseCropImage(imageFile) {
  if (!imageFile) throw new Error('No image file provided.');

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/diagnose`,
      { method: 'POST', body: formData },
      15000
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.message || err.error || `Diagnosis failed (HTTP ${response.status})`
      );
    }

    return await response.json();
  } catch (error) {
    const isNetworkError =
      error.name === 'AbortError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed');

    if (isNetworkError) {
      console.warn('[AgroCure] Backend unreachable – serving offline demo diagnosis.');
      return _buildMockDiagnosis();
    }

    console.error('[AgroCure] Diagnosis error:', error.message);
    throw error;
  }
}

export default { checkBackendHealth, diagnoseCropImage };
