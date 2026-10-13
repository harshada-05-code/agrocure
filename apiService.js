/**
 * AgroCure Frontend API Integration Helper
 * 
 * Target Frontend: https://agrocure.vercel.app/
 * Gateway: NestJS Gateway Orchestrator (Port 3000)
 * ML Service: FastAPI Inference Engine (Port 8000)
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Checks the health of the AgroCure Gateway and connected FastAPI ML Service.
 * @returns {Promise<{ status: string, service: string, timestamp: string, ml_service: object }>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[AgroCure API] Error checking health:', error);
    throw error;
  }
}

/**
 * Uploads a soybean crop leaf image to the NestJS Gateway for foliar disease
 * classification and agronomic remedy retrieval.
 * 
 * @param {File | Blob} imageFile - The leaf image selected by the user (from file input or camera capture).
 * @returns {Promise<{
 *   success: boolean,
 *   timestamp: string,
 *   diagnosis: {
 *     predicted_class: string,
 *     confidence: number,
 *     confidence_band: "HIGH" | "MODERATE" | "LOW",
 *     top3_classes: Array<{ class_name: string, confidence: number }>,
 *     gradcam_heatmap_url: string
 *   },
 *   remedy: {
 *     condition: string,
 *     chemical: { medicine: string, dosage: string, safety_interval_days: number },
 *     organic: { solution: string },
 *     cultural: string
 *   }
 * }>}
 */
export async function diagnoseCropImage(imageFile) {
  if (!imageFile) {
    throw new Error('Please provide a valid image file to diagnose.');
  }

  const formData = new FormData();
  // Field name 'image' matches NestJS FileInterceptor('image')
  formData.append('image', imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/diagnose`, {
      method: 'POST',
      body: formData,
      // Note: Do NOT set Content-Type header manually; fetch sets boundary automatically for FormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || errorData.error || `Diagnosis failed with status: ${response.status}`;
      throw new Error(message);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[AgroCure API] Diagnosis request error:', error);
    throw error;
  }
}

export default {
  checkBackendHealth,
  diagnoseCropImage,
};
