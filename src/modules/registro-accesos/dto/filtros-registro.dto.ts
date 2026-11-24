import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Los filtros del listado:
// GET /registro-accesos?evento=INGRESO&usuario_id=3&desde=2026-11-01&hasta=2026-11-30
// En cada campo, los decoradores se revisan de abajo hacia arriba.
export class FiltrosRegistroDto {
  // El código del tipo de evento: INGRESO, INGRESO_FALLIDO, SALIDA...
  @IsOptional()
  @MaxLength(30, { message: 'El evento puede tener hasta 30 caracteres' })
  @IsString({ message: 'El evento es un código, por ejemplo INGRESO' })
  evento?: string;

  // Lo que llega por la URL es texto: @Type(() => Number) lo pasa a número
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'usuario_id tiene que ser el id de un usuario' })
  usuario_id?: number;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'La fecha desde no existe' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha desde va como AAAA-MM-DD',
  })
  desde?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'La fecha hasta no existe' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha hasta va como AAAA-MM-DD',
  })
  hasta?: string;
}
