import { IsBoolean, IsInt } from 'class-validator';

// Para activar o desactivar una cuenta: las cuentas no se borran
export class CambiarEstadoDto {
  @IsBoolean({ message: 'activo tiene que ser true o false' })
  activo: boolean;

  // Quién hace el cambio. Cuando se protejan las rutas, va a salir del login
  @IsInt({ message: 'hecho_por_id tiene que ser el id de un usuario' })
  hecho_por_id: number;
}
