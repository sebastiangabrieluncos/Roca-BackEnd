import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { NoticiasModule } from '../noticias/noticias.module.js';
import { InscripcionesModule } from '../inscripciones/inscripciones.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RegistroAccesosModule } from '../registro-accesos/registro-accesos.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    UsuariosModule,
    NoticiasModule,
    InscripcionesModule,
    AuthModule,
    RegistroAccesosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
