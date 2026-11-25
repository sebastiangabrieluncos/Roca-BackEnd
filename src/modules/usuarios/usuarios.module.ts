import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosController } from './usuarios.controller.js';
import { RegistroAccesosModule } from '../registro-accesos/registro-accesos.module.js';

@Module({
  // Para registrar las altas, ediciones y cambios de estado de las cuentas
  imports: [RegistroAccesosModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
