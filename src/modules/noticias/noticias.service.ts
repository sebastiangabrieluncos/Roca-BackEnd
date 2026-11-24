import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { CreateNoticiaDto } from './dto/create-noticia.dto.js';
import { UpdateNoticiaDto } from './dto/update-noticia.dto.js';

// Lo que se trae de cada noticia: su categoría y el nombre de quien la escribió.
// En el esquema, la relación con el autor se llama usuario (la nombró db pull).
const CON_CATEGORIA_Y_AUTOR = {
  categoria_noticia: true,
  usuario: { select: { id: true, nombres: true, apellido: true } },
} satisfies Prisma.noticiaInclude;

@Injectable()
export class NoticiasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNoticiaDto) {
    await this.validarCategoria(dto.categoria_id);
    await this.validarAutor(dto.autor_id);

    return this.prisma.noticia.create({
      data: dto,
      include: CON_CATEGORIA_Y_AUTOR,
    });
  }

  // Con soloPublicadas en true, devuelve solo lo que se ve en el portal
  findAll(soloPublicadas: boolean) {
    return this.prisma.noticia.findMany({
      where: soloPublicadas ? { publicada: true } : {},
      include: CON_CATEGORIA_Y_AUTOR,
      orderBy: { fecha: 'desc' },
    });
  }

  async findOne(id: number) {
    const noticia = await this.prisma.noticia.findUnique({
      where: { id },
      include: CON_CATEGORIA_Y_AUTOR,
    });

    if (!noticia) {
      throw new NotFoundException(`No existe la noticia ${id}`);
    }

    return noticia;
  }

  // También sirve para publicar o despublicar: { "publicada": true }
  async update(id: number, dto: UpdateNoticiaDto) {
    await this.findOne(id);

    if (dto.categoria_id !== undefined) {
      await this.validarCategoria(dto.categoria_id);
    }
    if (dto.autor_id !== undefined) {
      await this.validarAutor(dto.autor_id);
    }

    return this.prisma.noticia.update({
      where: { id },
      // La base completa actualizada_el solo al crear: al editar la ponemos nosotros
      data: { ...dto, actualizada_el: new Date() },
      include: CON_CATEGORIA_Y_AUTOR,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.noticia.delete({ where: { id } });
  }

  private async validarCategoria(categoriaId: number) {
    const categoria = await this.prisma.categoria_noticia.findUnique({
      where: { id: categoriaId },
    });

    if (!categoria) {
      throw new BadRequestException(`No existe la categoría ${categoriaId}`);
    }
  }

  private async validarAutor(autorId: number) {
    const autor = await this.prisma.usuario.findUnique({
      where: { id: autorId },
    });

    if (!autor) {
      throw new BadRequestException(`No existe el usuario ${autorId}`);
    }
  }
}
