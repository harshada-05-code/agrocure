import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DiagnoseController } from './diagnose.controller';
import { DiagnoseService } from './diagnose.service';

@Module({
  imports: [HttpModule],
  controllers: [DiagnoseController],
  providers: [DiagnoseService],
  exports: [DiagnoseService],
})
export class DiagnoseModule {}
