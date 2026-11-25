import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { RegistroAccesosModule } from '../registro-accesos/registro-accesos.module.js';

@Module({
  imports: [
    // Igual que la cátedra: la clave sale del .env y el token dura 1 hora
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('La variable de entorno JWT_SECRET es obligatoria.');
        }

        return { secret, signOptions: { expiresIn: '1h' } };
      },
    }),
    // Para registrar los ingresos y los intentos fallidos
    RegistroAccesosModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
