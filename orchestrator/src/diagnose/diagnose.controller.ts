import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DiagnoseService } from './diagnose.service';

@Controller('api/v1')
export class DiagnoseController {
  constructor(private readonly diagnoseService: DiagnoseService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    return this.diagnoseService.checkHealth();
  }

  @Post('diagnose')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async diagnose(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please provide an image file under the "image" field.');
    }
    return this.diagnoseService.diagnoseImage(file);
  }
}
