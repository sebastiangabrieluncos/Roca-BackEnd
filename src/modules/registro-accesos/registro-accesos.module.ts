import { Module } from '@nestjs/common';
import { RegistroAccesosService } from './registro-accesos.service.js';
import { RegistroAccesosController } from './registro-accesos.controller.js';

@Module({
  controllers: [RegistroAccesosController],
  providers: [RegistroAccesosService],
})
export class RegistroAccesosModule {}
