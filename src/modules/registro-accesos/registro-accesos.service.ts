import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { CreateRegistroAccesoDto } from './dto/create-registro-acceso.dto.js';
import { FiltrosRegistroDto } from './dto/filtros-registro.dto.js';

// Lo que se trae de cada evento: qué tipo es y de qué cuenta
const CON_EVENTO_Y_USUARIO = {
  tipo_evento: true,
  usuario: {
    select: { id: true, usuario: true, nombres: true, apellido: true },
  },
} satisfies Prisma.registro_accesoInclude;

// El registro de control no se edita ni se borra: solo se agrega y se consulta.
// El id de esta tabla es BIGINT, y JSON no sabe escribir ese tipo de número:
// por eso, antes de responder, se pasa a Number con Number(registro.id).
@Injectable()
export class RegistroAccesosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRegistroAccesoDto) {
    const tipo = await this.prisma.tipo_evento.findUnique({
      where: { id: dto.tipo_evento_id },
    });
    if (!tipo) {
      throw new BadRequestException(
        `No existe el tipo de evento ${dto.tipo_evento_id}`,
      );
    }

    if (dto.usuario_id) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: dto.usuario_id },
      });
      if (!usuario) {
        throw new BadRequestException(`No existe el usuario ${dto.usuario_id}`);
      }
    }

    const registro = await this.prisma.registro_acceso.create({
      data: dto,
      include: CON_EVENTO_Y_USUARIO,
    });
    return { ...registro, id: Number(registro.id) };
  }

  // Del más nuevo al más viejo, hasta 500, como el registro del front
  async findAll(filtros: FiltrosRegistroDto) {
    const registros = await this.prisma.registro_acceso.findMany({
      where: {
        tipo_evento: filtros.evento ? { codigo: filtros.evento } : undefined,
        usuario_id: filtros.usuario_id,
        // Los días se toman completos y en horario de Argentina (-03:00)
        fecha: {
          gte: filtros.desde
            ? new Date(`${filtros.desde}T00:00:00-03:00`)
            : undefined,
          lte: filtros.hasta
            ? new Date(`${filtros.hasta}T23:59:59.999-03:00`)
            : undefined,
        },
      },
      include: CON_EVENTO_Y_USUARIO,
      orderBy: { fecha: 'desc' },
      take: 500,
    });

    return registros.map((registro) => ({
      ...registro,
      id: Number(registro.id),
    }));
  }

  async findOne(id: number) {
    const registro = await this.prisma.registro_acceso.findUnique({
      where: { id },
      include: CON_EVENTO_Y_USUARIO,
    });

    if (!registro) {
      throw new NotFoundException(`No existe el registro ${id}`);
    }

    return { ...registro, id: Number(registro.id) };
  }
}
