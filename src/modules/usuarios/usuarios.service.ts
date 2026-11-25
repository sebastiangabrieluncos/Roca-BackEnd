import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { RegistroAccesosService } from '../registro-accesos/registro-accesos.service.js';
import { hashPassword } from '../auth/password.util.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto.js';

// Lo que se muestra de cada cuenta: nunca la contraseña.
// Del registro se trae solo el último ingreso, que es el «último acceso».
const DATOS_DE_LA_CUENTA = {
  id: true,
  nombres: true,
  apellido: true,
  usuario: true,
  mail: true,
  activo: true,
  creado_el: true,
  rol: true,
  grado: true,
  registro_acceso: {
    where: { tipo_evento: { codigo: 'INGRESO' } },
    orderBy: { fecha: 'desc' },
    take: 1,
    select: { fecha: true },
  },
} satisfies Prisma.usuarioSelect;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registro: RegistroAccesosService,
  ) {}

  async create(dto: CreateUsuarioDto) {
    await this.validarQuienLoHace(dto.hecho_por_id);
    await this.validarUsuarioYMail(dto.usuario, dto.mail);
    const gradoId = await this.gradoSegunRol(dto.rol_id, dto.grado_id);

    const nueva = await this.prisma.usuario.create({
      data: {
        nombres: dto.nombres,
        apellido: dto.apellido,
        usuario: dto.usuario,
        mail: dto.mail,
        password_hash: await hashPassword(dto.password),
        rol_id: dto.rol_id,
        grado_id: gradoId,
      },
    });

    await this.registro.registrar('USUARIO_CREADO', {
      usuario_id: dto.hecho_por_id,
      detalle: `Creó la cuenta ${nueva.usuario}`,
    });

    return this.findOne(nueva.id);
  }

  async findAll() {
    const usuarios = await this.prisma.usuario.findMany({
      select: DATOS_DE_LA_CUENTA,
      orderBy: [{ apellido: 'asc' }, { nombres: 'asc' }],
    });

    // El último acceso es la fecha del último INGRESO del registro
    return usuarios.map(({ registro_acceso, ...usuario }) => ({
      ...usuario,
      ultimo_acceso: registro_acceso[0]?.fecha ?? null,
    }));
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: DATOS_DE_LA_CUENTA,
    });

    if (!usuario) {
      throw new NotFoundException(`No existe la cuenta ${id}`);
    }

    const { registro_acceso, ...datos } = usuario;
    return { ...datos, ultimo_acceso: registro_acceso[0]?.fecha ?? null };
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const actual = await this.findOne(id);
    await this.validarQuienLoHace(dto.hecho_por_id);
    await this.validarUsuarioYMail(dto.usuario, dto.mail, id);

    // Lo que no vino queda como estaba
    const rolId = dto.rol_id ?? actual.rol.id;
    const gradoId = await this.gradoSegunRol(
      rolId,
      dto.grado_id ?? actual.grado?.id,
    );

    // Si deja de ser vicedirectora, tiene que quedar otra activa
    if (actual.rol.codigo === 'vicedirectora' && rolId !== actual.rol.id) {
      await this.validarQueQuedeOtraVicedirectora(actual.activo);
    }

    await this.prisma.usuario.update({
      where: { id },
      data: {
        nombres: dto.nombres,
        apellido: dto.apellido,
        usuario: dto.usuario,
        mail: dto.mail,
        rol_id: rolId,
        grado_id: gradoId,
        // La contraseña cambia solo si vino una nueva
        password_hash: dto.password
          ? await hashPassword(dto.password)
          : undefined,
      },
    });

    const conPassword = dto.password ? ' y su contraseña' : '';
    await this.registro.registrar('USUARIO_EDITADO', {
      usuario_id: dto.hecho_por_id,
      detalle: `Modificó la cuenta ${dto.usuario ?? actual.usuario}${conPassword}`,
    });

    return this.findOne(id);
  }

  // Las cuentas no se borran: se desactivan, porque tienen noticias,
  // inscripciones y accesos a su nombre
  async cambiarEstado(id: number, dto: CambiarEstadoDto) {
    const actual = await this.findOne(id);
    await this.validarQuienLoHace(dto.hecho_por_id);

    if (!dto.activo) {
      if (id === dto.hecho_por_id) {
        throw new BadRequestException('No podés desactivar tu propia cuenta.');
      }
      if (actual.rol.codigo === 'vicedirectora') {
        await this.validarQueQuedeOtraVicedirectora(actual.activo);
      }
    }

    await this.prisma.usuario.update({
      where: { id },
      data: { activo: dto.activo },
    });

    await this.registro.registrar(
      dto.activo ? 'USUARIO_REACTIVADO' : 'USUARIO_DESACTIVADO',
      {
        usuario_id: dto.hecho_por_id,
        detalle: `${dto.activo ? 'Reactivó' : 'Desactivó'} la cuenta ${actual.usuario}`,
      },
    );

    return this.findOne(id);
  }

  // Solo la vicedirección administra las cuentas, como en el front
  private async validarQuienLoHace(id: number) {
    const quien = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });

    if (!quien || !quien.activo || quien.rol.codigo !== 'vicedirectora') {
      throw new ForbiddenException(
        'Solo una cuenta activa de vicedirección puede administrar las cuentas.',
      );
    }
  }

  // El usuario y el mail no pueden ser de otra cuenta.
  // Al editar, se ignora la cuenta que se está editando.
  private async validarUsuarioYMail(
    usuario?: string,
    mail?: string,
    idActual?: number,
  ) {
    if (usuario) {
      const otra = await this.prisma.usuario.findUnique({
        where: { usuario },
        select: { id: true },
      });
      if (otra && otra.id !== idActual) {
        throw new ConflictException(
          'Ya existe una cuenta con ese nombre de usuario.',
        );
      }
    }

    if (mail) {
      const otra = await this.prisma.usuario.findUnique({
        where: { mail },
        select: { id: true },
      });
      if (otra && otra.id !== idActual) {
        throw new ConflictException('Ya existe una cuenta con ese mail.');
      }
    }
  }

  // Solo los maestros tienen grado a cargo, y para ellos es obligatorio.
  // Devuelve el grado que hay que guardar: null si no es maestro.
  private async gradoSegunRol(rolId: number, gradoId?: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) {
      throw new BadRequestException(`No existe el rol ${rolId}`);
    }

    if (rol.codigo !== 'maestro') {
      return null;
    }

    if (gradoId === undefined) {
      throw new BadRequestException('Elegí el grado a cargo del maestro.');
    }

    const grado = await this.prisma.grado.findUnique({
      where: { id: gradoId },
    });
    if (!grado) {
      throw new BadRequestException(`No existe el grado ${gradoId}`);
    }

    return gradoId;
  }

  // Si la cuenta es la única vicedirectora activa, no puede dejar de serlo
  private async validarQueQuedeOtraVicedirectora(estaActiva: boolean) {
    if (!estaActiva) {
      return;
    }

    const activas = await this.prisma.usuario.count({
      where: { activo: true, rol: { codigo: 'vicedirectora' } },
    });
    if (activas <= 1) {
      throw new BadRequestException(
        'Tiene que quedar al menos una cuenta de vicedirección activa.',
      );
    }
  }
}
