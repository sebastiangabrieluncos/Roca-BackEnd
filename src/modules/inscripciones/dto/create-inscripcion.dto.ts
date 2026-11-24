import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { vinculo_tutor } from '../../../generated/prisma/enums.js';
import { AlumnoDto } from './alumno.dto.js';
import { TutorDto } from './tutor.dto.js';
import { ViviendaDto } from './vivienda.dto.js';
import { ContactoDto } from './contacto.dto.js';

// La ficha completa, como la arma el formulario de cinco pasos.

// @Type le dice a Nest de qué clase es cada objeto de adentro: sin eso,
// los datos del alumno, los tutores, la vivienda y los contactos no se validan.
export class CreateInscripcionDto {
  @IsInt({ message: 'El grado tiene que ser el id de un grado' })
  grado_id: number;

  @Max(2100, { message: 'El ciclo lectivo va de 2000 a 2100' })
  @Min(2000, { message: 'El ciclo lectivo va de 2000 a 2100' })
  @IsInt({ message: 'El ciclo lectivo es un año, por ejemplo 2026' })
  ciclo_lectivo: number;

  @IsBoolean({ message: 'Repitente tiene que ser true o false' })
  repitente: boolean;

  @IsOptional()
  @MaxLength(80, {
    message: 'La escuela de origen puede tener hasta 80 caracteres',
  })
  @IsString({ message: 'La escuela de origen es un texto' })
  escuela_origen?: string;

  @IsOptional()
  @Max(99, { message: 'La cantidad de hermanos va de 0 a 99' })
  @Min(0, { message: 'La cantidad de hermanos va de 0 a 99' })
  @IsInt({ message: 'La cantidad de hermanos es un número entero' })
  cantidad_hermanos?: number;

  @IsInt({ message: 'cargada_por_id tiene que ser el id de un usuario' })
  cargada_por_id: number;

  // Quién figura como tutor del niño: el padre o la madre
  @IsEnum(vinculo_tutor, { message: 'El responsable es padre o madre' })
  responsable: vinculo_tutor;

  @ValidateNested()
  @Type(() => AlumnoDto)
  @IsObject({ message: 'Faltan los datos del alumno' })
  alumno: AlumnoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TutorDto)
  @IsObject({ message: 'Los datos del padre van en un objeto' })
  padre?: TutorDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TutorDto)
  @IsObject({ message: 'Los datos de la madre van en un objeto' })
  madre?: TutorDto;

  @ValidateNested()
  @Type(() => ViviendaDto)
  @IsObject({ message: 'Faltan los datos de la vivienda' })
  vivienda: ViviendaDto;

  @ValidateNested({ each: true })
  @Type(() => ContactoDto)
  @ArrayMaxSize(2, { message: 'Se pueden cargar hasta dos contactos' })
  @ArrayMinSize(1, { message: 'Cargá al menos un contacto de emergencia' })
  @IsArray({ message: 'Faltan los contactos de emergencia' })
  contactos: ContactoDto[];
}
