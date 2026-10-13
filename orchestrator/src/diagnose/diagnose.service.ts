import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { getRemedyForCondition, AgronomicRemedy } from './remedies.data';

export interface MLClassificationResult {
  predicted_class: string;
  confidence: number;
  confidence_band: string;
  top3_classes: Array<{ class_name: string; confidence: number }>;
  gradcam_heatmap_url: string;
}

export interface DiagnosisResponse {
  success: boolean;
  timestamp: string;
  diagnosis: MLClassificationResult;
  remedy: AgronomicRemedy;
}

@Injectable()
export class DiagnoseService {
  private readonly logger = new Logger(DiagnoseService.name);
  private readonly mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

  constructor(private readonly httpService: HttpService) {}

  async checkHealth(): Promise<{
    status: string;
    service: string;
    timestamp: string;
    ml_service: {
      status: string;
      url: string;
      details?: any;
      error?: string;
    };
  }> {
    const timestamp = new Date().toISOString();
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.mlServiceUrl}/health`, { timeout: 4000 }),
      );
      return {
        status: 'healthy',
        service: 'NestJS Gateway Orchestrator',
        timestamp,
        ml_service: {
          status: 'connected',
          url: this.mlServiceUrl,
          details: response.data,
        },
      };
    } catch (error: any) {
      this.logger.warn(`FastAPI ML service unreachable at ${this.mlServiceUrl}: ${error.message}`);
      return {
        status: 'healthy',
        service: 'NestJS Gateway Orchestrator',
        timestamp,
        ml_service: {
          status: 'disconnected',
          url: this.mlServiceUrl,
          error: error.message,
        },
      };
    }
  }

  async diagnoseImage(file: Express.Multer.File): Promise<DiagnosisResponse> {
    if (!file) {
      throw new HttpException('No image file provided for diagnosis.', HttpStatus.BAD_REQUEST);
    }

    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname || 'leaf.jpg',
        contentType: file.mimetype || 'image/jpeg',
      });

      const response = await firstValueFrom(
        this.httpService.post<MLClassificationResult>(
          `${this.mlServiceUrl}/api/v1/ml/classify-foliar`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 10000,
          },
        ),
      );

      const mlResult = response.data;
      const remedy = getRemedyForCondition(mlResult.predicted_class);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        diagnosis: mlResult,
        remedy,
      };
    } catch (error: any) {
      this.logger.error(`Error forwarding image to ML engine: ${error.message}`);
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const detail = error.response?.data?.detail || error.message || 'ML service diagnosis failed.';
      throw new HttpException(
        {
          success: false,
          error: 'Diagnosis forwarding failed',
          message: detail,
          statusCode: status,
        },
        status,
      );
    }
  }
}
