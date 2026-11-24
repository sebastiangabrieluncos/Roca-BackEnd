import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  tenencia_vivienda,
  tipo_vivienda,
} from '../../../generated/prisma/enums.js';

// Datos de la vivienda: paso 4 de la ficha.

export class ViviendaDto {
  @Max(30, {
    message: 'Tienen que ser entre 2 y 30 personas, contando al alumno',
  })
  @Min(2, {
    message: 'Tienen que ser entre 2 y 30 personas, contando al alumno',
  })
  @IsInt({ message: 'Indicá cuántas personas viven en la casa' })
  personas_en_casa: number;

  @IsEnum(tenencia_vivienda, {
    message: 'La tenencia es propia, alquilada u otros',
  })
  tenencia: tenencia_vivienda;

  @IsEnum(tipo_vivienda, {
    message: 'El tipo de vivienda es material, prefabricada u otros',
  })
  tipo: tipo_vivienda;

  @IsOptional()
  @Max(999, { message: 'La distancia va de 0 a 999 cuadras' })
  @Min(0, { message: 'La distancia va de 0 a 999 cuadras' })
  @IsInt({ message: 'La distancia se indica en cuadras, sin decimales' })
  distancia_cuadras?: number;
}
