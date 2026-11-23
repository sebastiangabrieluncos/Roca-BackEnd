import { Controller, Get } from '@nestjs/common';
import { CatalogosService } from './catalogos.service.js';

// Listas fijas que usan los formularios. Son de solo lectura
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get('grados')
  listarGrados() {
    return this.catalogosService.listarGrados();
  }

  @Get('roles')
  listarRoles() {
    return this.catalogosService.listarRoles();
  }

  @Get('provincias')
  listarProvincias() {
    return this.catalogosService.listarProvincias();
  }

  @Get('categorias')
  listarCategorias() {
    return this.catalogosService.listarCategorias();
  }

  @Get('tipos-evento')
  listarTiposEvento() {
    return this.catalogosService.listarTiposEvento();
  }
}