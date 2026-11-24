import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { sexo } from '../../../generated/prisma/enums.js';
import { Recortar } from '../../../common/decorators/recortar.decorator.js';

// Datos del alumno: paso 1 de la ficha.

export class AlumnoDto {
  @Recortar()
  @MaxLength(60, { message: 'El apellido puede tener hasta 60 letras' })
  @MinLength(2, { message: 'El apellido tiene que tener al menos 2 letras' })
  @IsString({ message: 'El apellido es obligatorio' })
  apellido: string;

  @Recortar()
  @MaxLength(60, { message: 'Los nombres pueden tener hasta 60 letras' })
  @MinLength(2, { message: 'Los nombres tienen que tener al menos 2 letras' })
  @IsString({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @Matches(/^\d{7,8}$/, { message: 'Ingresá un DNI de 7 u 8 dígitos' })
  dni: string;

  // Opcional. El dígito verificador y que coincida con el DNI los controla el service
  @IsOptional()
  @Matches(/^(20|23|24|27)\d{9}$/, {
    message: 'El CUIL tiene 11 dígitos y empieza con 20, 23, 24 o 27',
  })
  cuil?: string;

  @IsEnum(sexo, { message: 'El sexo tiene que ser femenino, masculino o x' })
  sexo: sexo;

  // Formato AAAA-MM-DD. La edad en el ciclo la controla el service
  @IsDateString(
    { strict: true },
    { message: 'Ingresá una fecha de nacimiento válida (AAAA-MM-DD)' },
  )
  fecha_nacimiento: string;

  @IsOptional()
  @MaxLength(30, { message: 'El acta puede tener hasta 30 caracteres' })
  @IsString({ message: 'El acta de nacimiento es un texto' })
  acta_nacimiento?: string;

  @IsOptional()
  @IsInt({ message: 'La provincia tiene que ser el id de una provincia' })
  provincia_nacimiento_id?: number;

  @IsOptional()
  @MaxLength(100, { message: 'El lugar puede tener hasta 100 caracteres' })
  @IsString({ message: 'El lugar de nacimiento es un texto' })
  lugar_nacimiento?: string;

  @Recortar()
  @MaxLength(80, { message: 'La calle puede tener hasta 80 caracteres' })
  @MinLength(3, { message: 'Escribí el nombre de la calle' })
  @IsString({ message: 'La calle es obligatoria' })
  domicilio_calle: string;

  @Matches(/^(\d{1,5}|S\/N)$/, {
    message: 'El número de casa es un número o S/N',
  })
  domicilio_numero: string;

  @IsOptional()
  @MaxLength(20, {
    message: 'El piso y depto pueden tener hasta 20 caracteres',
  })
  @IsString({ message: 'El piso y depto son un texto' })
  domicilio_piso_depto?: string;

  @IsOptional()
  @MaxLength(60, { message: 'El barrio puede tener hasta 60 caracteres' })
  @IsString({ message: 'El barrio es un texto' })
  domicilio_barrio?: string;
}
