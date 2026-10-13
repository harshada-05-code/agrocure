import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('NestGateway');
  const app = await NestFactory.create(AppModule);

  // Configure CORS for target frontend and local testing
  const allowedOrigins = [
    'https://agrocure.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Also allow vercel preview deployments matching agrocure
        if (origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`AgroCure Gateway Orchestrator running on http://localhost:${port}`);
  logger.log(`Connected ML Engine URL: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
}

bootstrap();
