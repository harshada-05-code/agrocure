const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[AgroCure Frontend] Backend health error:', error);
    throw error;
  }
}

export async function diagnoseCropImage(imageFile) {
  if (!imageFile) {
    throw new Error('Please select an image file to analyze.');
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagnose`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Diagnosis failed with code: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[AgroCure Frontend] Diagnosis request error:', error);
    throw error;
  }
}

export default {
  checkBackendHealth,
  diagnoseCropImage,
};
