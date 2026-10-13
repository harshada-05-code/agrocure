import { Module } from '@nestjs/common';
import { DiagnoseModule } from './diagnose/diagnose.module';

@Module({
  imports: [DiagnoseModule],
})
export class AppModule {}
