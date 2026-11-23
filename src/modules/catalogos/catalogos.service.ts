import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogosService {
  listarGrados() {
    return 'Devuelve los grados';
  }

  listarRoles() {
    return 'Devuelve los roles';
  }

  listarProvincias() {
    return 'Devuelve las provincias';
  }

  listarCategorias() {
    return 'Devuelve las categorías de noticias';
  }

  listarTiposEvento() {
    return 'Devuelve los tipos de evento del registro de accesos';
  }
}
