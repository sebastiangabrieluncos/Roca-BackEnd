import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegistroAccesosService } from '../registro-accesos/registro-accesos.service.js';
import { LoginDto } from './dto/login.dto.js';
import { verifyPassword } from './password.util.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly registro: RegistroAccesosService,
  ) {}

  async login(dto: LoginDto) {
    // Se puede entrar con el nombre de usuario o con el mail
    const cuenta = await this.prisma.usuario.findFirst({
      where: { OR: [{ usuario: dto.usuario }, { mail: dto.usuario }] },
      include: { rol: true },
    });

    // El mismo mensaje si la cuenta no existe o si la contraseña está mal:
    // así no se puede averiguar qué cuentas existen
    if (
      !cuenta ||
      !(await verifyPassword(dto.password, cuenta.password_hash))
    ) {
      await this.registro.registrar('INGRESO_FALLIDO', {
        usuario_id: cuenta?.id,
        usuario_ingresado: dto.usuario,
        detalle: cuenta ? 'Contraseña incorrecta' : 'Usuario inexistente',
      });
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    if (!cuenta.activo) {
      await this.registro.registrar('INGRESO_FALLIDO', {
        usuario_id: cuenta.id,
        detalle: 'Cuenta desactivada',
      });
      throw new UnauthorizedException(
        'Tu cuenta está desactivada. Consultá con la vicedirección.',
      );
    }

    await this.registro.registrar('INGRESO', { usuario_id: cuenta.id });

    // El token lleva quién es y qué rol tiene: dura 1 hora (auth.module.ts)
    const token = await this.jwtService.signAsync({
      sub: cuenta.id,
      usuario: cuenta.usuario,
      rol: cuenta.rol.codigo,
      grado_id: cuenta.grado_id,
    });

    return {
      access_token: token,
      usuario: {
        id: cuenta.id,
        nombres: cuenta.nombres,
        apellido: cuenta.apellido,
        usuario: cuenta.usuario,
        mail: cuenta.mail,
        rol: cuenta.rol.codigo,
        grado_id: cuenta.grado_id,
      },
    };
  }
}
