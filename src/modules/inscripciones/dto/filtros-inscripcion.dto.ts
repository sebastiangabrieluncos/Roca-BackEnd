import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Recortar } from '../../../common/decorators/recortar.decorator.js';

// Los filtros del listado: GET /inscripciones?ciclo=2026&grado_id=2&buscar=gomez
// Todo lo que llega por la URL es texto: @Type(() => Number) lo pasa a número.
export class FiltrosInscripcionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ciclo es un año, por ejemplo 2026' })
  ciclo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'grado_id tiene que ser el id de un grado' })
  grado_id?: number;

  // Busca en el apellido, los nombres o el DNI del alumno
  @IsOptional()
  @Recortar()
  @MaxLength(60, { message: 'La búsqueda puede tener hasta 60 caracteres' })
  @IsString({ message: 'La búsqueda es un texto' })
  buscar?: string;
}
