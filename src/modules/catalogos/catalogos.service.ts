import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// Las listas fijas de los formularios, leídas de la base.
// Son de solo lectura: las carga roca_db.sql.
@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  listarGrados() {
    return this.prisma.grado.findMany({ orderBy: { orden: 'asc' } });
  }

  listarRoles() {
    return this.prisma.rol.findMany({ orderBy: { id: 'asc' } });
  }

  listarProvincias() {
    return this.prisma.provincia.findMany({ orderBy: { nombre: 'asc' } });
  }

  listarCategorias() {
    return this.prisma.categoria_noticia.findMany({ orderBy: { id: 'asc' } });
  }

  listarTiposEvento() {
    return this.prisma.tipo_evento.findMany({ orderBy: { id: 'asc' } });
  }
}
