import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsInt } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto.js';

// Al editar, cada dato es opcional (también la contraseña),
// pero los que vienen se validan igual que en el alta.
// Lo único obligatorio es quién hace el cambio.
export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ['hecho_por_id'] as const),
) {
  @IsInt({ message: 'hecho_por_id tiene que ser el id de un usuario' })
  hecho_por_id: number;
}
