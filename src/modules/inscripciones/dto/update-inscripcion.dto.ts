import { OmitType } from '@nestjs/mapped-types';
import { IsInt } from 'class-validator';
import { CreateInscripcionDto } from './create-inscripcion.dto.js';

// Editar la ficha es volver a mandarla completa, como hace el formulario del front.
// Tiene las mismas reglas que el alta, pero en lugar de quién la cargó
// dice quién la modifica.
export class UpdateInscripcionDto extends OmitType(CreateInscripcionDto, [
  'cargada_por_id',
] as const) {
  @IsInt({ message: 'actualizada_por_id tiene que ser el id de un usuario' })
  actualizada_por_id: number;
}
