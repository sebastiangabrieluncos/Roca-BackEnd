import { Module } from '@nestjs/common';
import { RegistroAccesosService } from './registro-accesos.service.js';
import { RegistroAccesosController } from './registro-accesos.controller.js';

@Module({
  controllers: [RegistroAccesosController],
  providers: [RegistroAccesosService],
  // Lo usan usuarios y auth para registrar sus eventos
  exports: [RegistroAccesosService],
})
export class RegistroAccesosModule {}
