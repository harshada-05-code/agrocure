# AgroCure Backend Ecosystem

Backend infrastructure for the **AgroCure** foliar disease diagnosis platform, integrating a lightweight **FastAPI ML Engine** for soybean crop disease inference with a **NestJS Gateway Orchestrator** providing verified agronomic remedies.

- **GitHub Repository**: [https://github.com/harshada-05-code/agrocure](https://github.com/harshada-05-code/agrocure)
- **Target Frontend**: [https://agrocure.vercel.app/](https://agrocure.vercel.app/)

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       React Frontend (Vercel)        |
                      |     https://agrocure.vercel.app/      |
                      +-------------------+-------------------+
                                          |
                        multipart/form-data (image)
                                          v
                      +---------------------------------------+
                      |       NestJS Gateway Orchestrator     |
                      |            Port: 3000                 |
                      |  - Health Monitoring                  |
                      |  - Dynamic Agronomic Remedy Engine    |
                      |  - CORS Configured                    |
                      +-------------------+-------------------+
                                          |
                        POST /api/v1/ml/classify-foliar
                                          v
                      +---------------------------------------+
                      |         FastAPI ML Engine             |
                      |            Port: 8000                 |
                      |  - Lightweight CPU Inference          |
                      |  - 6 Soybean Disease Classes          |
                      |  - Grad-CAM Heatmap Generation        |
                      +---------------------------------------+
```

---

## 6 Supported Soybean Disease Conditions

1. **`Caterpillar and Semilooper Pest Attack`**
2. **`Healthy_Soyabean`**
3. **`Soyabean_Frog_Leaf_Eye`**
4. **`Soyabean_Mosaic`**
5. **`Soyabean_Rust`**
6. **`Soyabean_Spectoria_Brown_Spot`**

---

## Quick Start

### Prerequisites
- Node.js >= 20
- Python >= 3.10
- Git

### 1. Concurrent Launch (All Services)

**Using NPM:**
```bash
npm start
```

**Using Bash (`start.sh`):**
```bash
chmod +x start.sh
./start.sh
```

**Using PowerShell (`start.ps1` on Windows):**
```powershell
.\start.ps1
```

---

### 2. Manual Individual Service Launch

#### A. FastAPI ML Engine (Port 8000)
```bash
cd ml_service
.venv/Scripts/python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Health Check: `http://localhost:8000/health`

#### B. NestJS Gateway Orchestrator (Port 3000)
```bash
cd orchestrator
npm run start
```
Health Check: `http://localhost:3000/api/v1/health`

---

## API Endpoints

### 1. Gateway Health Check
- **Endpoint**: `GET http://localhost:3000/api/v1/health`
- **Response**:
```json
{
  "status": "healthy",
  "service": "NestJS Gateway Orchestrator",
  "timestamp": "2026-10-13T07:11:37.532Z",
  "ml_service": {
    "status": "connected",
    "url": "http://localhost:8000",
    "details": {
      "status": "healthy",
      "service": "FastAPI ML Engine"
    }
  }
}
```

### 2. Diagnose Foliar Image
- **Endpoint**: `POST http://localhost:3000/api/v1/diagnose`
- **Method**: `POST`
- **Body**: `multipart/form-data` with key `image`
- **Sample Curl**:
```bash
curl -X POST -F "image=@sample_leaf.jpg" http://localhost:3000/api/v1/diagnose
```
- **Response**:
```json
{
  "success": true,
  "timestamp": "2026-10-13T07:12:37.590Z",
  "diagnosis": {
    "predicted_class": "Soyabean_Rust",
    "confidence": 0.6176,
    "confidence_band": "MODERATE",
    "top3_classes": [
      { "class_name": "Soyabean_Rust", "confidence": 0.6176 },
      { "class_name": "Soyabean_Spectoria_Brown_Spot", "confidence": 0.2390 },
      { "class_name": "Soyabean_Frog_Leaf_Eye", "confidence": 0.0733 }
    ],
    "gradcam_heatmap_url": "http://localhost:8000/static/heatmaps/gradcam_79ecf9a930.jpg"
  },
  "remedy": {
    "condition": "Soyabean_Rust",
    "chemical": {
      "medicine": "Hexaconazole 5% EC or Tebuconazole 25.9% EC",
      "dosage": "200 ml per acre in 200 liters of water at initial pustule appearance",
      "safety_interval_days": 20
    },
    "organic": {
      "solution": "Foliar application of Bordeaux mixture (1%) or Copper Oxychloride @ 2.5g/L water as a preventive protective barrier."
    },
    "cultural": "Ensure proper planting density and row spacing (45 cm) to promote air movement and lower canopy humidity. Plant early-maturing rust-tolerant soybean varieties. Monitor fields intensively during overcast, warm, humid weather intervals."
  }
}
```

---

## Frontend Integration Helper (`apiService.js`)

Copy `apiService.js` directly into your React project (`https://agrocure.vercel.app/`):

```javascript
import { diagnoseCropImage, checkBackendHealth } from './apiService';

async function handleImageUpload(file) {
  try {
    const result = await diagnoseCropImage(file);
    console.log('Diagnosis:', result.diagnosis.predicted_class);
    console.log('Confidence:', result.diagnosis.confidence_band);
    console.log('Chemical Remedy:', result.remedy.chemical);
    console.log('Organic Remedy:', result.remedy.organic);
    console.log('Grad-CAM Heatmap:', result.diagnosis.gradcam_heatmap_url);
  } catch (error) {
    console.error('Diagnosis failed:', error.message);
  }
}
```
