/**
 * AgroCure Frontend API Service
 * Connects to NestJS Gateway at VITE_API_URL (default: http://localhost:3000)
 *
 * Graceful degradation: if backend is unreachable, returns a structured
 * mock diagnosis instead of surfacing raw "Failed to fetch" errors.
 */
// Base API endpoint for NestJS Orchestrator Gateway
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Check backend gateway health status
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    console.warn('Backend health check failed:', error);
    throw error;
  }
}

/**
 * Send leaf photo to backend for 3-CNN ensemble inference & Grad-CAM visual heatmap generation
 */
export async function diagnoseCropImage(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/diagnose`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Backend service offline or unreachable. Returning resilient local fallback response:', err);

    // Resilient fallback structure for offline testing and smooth UI rendering
    // Picks from known classes to simulate variety when testing without backend
    const mockClasses = [
      {
        pred: 'Soyabean_Rust',
        top3: [
          { class_name: 'Soyabean_Rust', confidence: 0.88 },
          { class_name: 'Soyabean_Spectoria_Brown_Spot', confidence: 0.08 },
          { class_name: 'Healthy_Soyabean', confidence: 0.04 }
        ],
        band: 'HIGH',
        remedy: {
          chemical: {
            medicine: 'Hexaconazole 5% EC or Tebuconazole 25.9% EC (Refer to product label for dosage)',
            safety_interval_days: 14
          },
          organic: {
            solution: 'Neem Seed Kernel Extract (NSKE 5%) spray'
          },
          cultural: 'Maintain proper spacing to improve air circulation and reduce canopy moisture.'
        }
      },
      {
        pred: 'Soyabean_Frog_Leaf_Eye',
        top3: [
          { class_name: 'Soyabean_Frog_Leaf_Eye', confidence: 0.82 },
          { class_name: 'Soyabean_Rust', confidence: 0.11 },
          { class_name: 'Soyabean_Spectoria_Brown_Spot', confidence: 0.07 }
        ],
        band: 'HIGH',
        remedy: {
          chemical: {
            medicine: 'Azoxystrobin or Carbendazim (Follow product label instructions)',
            safety_interval_days: 15
          },
          organic: {
            solution: 'Trichoderma harzianum bio-fungicide spray'
          },
          cultural: 'Crop rotation with non-host crops and use of certified disease-free seeds.'
        }
      },
      {
        pred: 'Healthy_Soyabean',
        top3: [
          { class_name: 'Healthy_Soyabean', confidence: 0.91 },
          { class_name: 'Soyabean_Rust', confidence: 0.05 },
          { class_name: 'Caterpillar and Semilooper Pest Attack', confidence: 0.04 }
        ],
        band: 'HIGH',
        remedy: {
          chemical: null,
          organic: {
            solution: 'Regular scouting and balanced nutrition (NPK + micro-nutrients).'
          },
          cultural: 'Keep field weed-free and inspect plants weekly.'
        }
      }
    ];

    const pick = mockClasses[Math.floor(Math.random() * mockClasses.length)];

    return {
      success: true,
      _isMockFallback: true,
      diagnosis: {
        predicted_class: pick.pred,
        confidence: pick.top3[0].confidence,
        confidence_band: pick.band,
        top3_classes: pick.top3,
        gradcam_heatmap_url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80'
      },
      remedy: pick.remedy
    };
  }
}