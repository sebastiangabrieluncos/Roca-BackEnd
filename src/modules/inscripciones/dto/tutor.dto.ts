import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  caracter_laboral,
  estado_estudio,
  nivel_estudio,
  plan_social,
} from '../../../generated/prisma/enums.js';
import { Recortar } from '../../../common/decorators/recortar.decorator.js';
import { EsTelefono } from '../../../common/decorators/es-telefono.decorator.js';

// Datos del padre o de la madre: pasos 2 y 3 de la ficha.
// Todo es opcional acá: qué es obligatorio depende de quién es el responsable,
// y eso lo controla el service. Lo que venga, tiene que tener buen formato.
export class TutorDto {
  @IsOptional()
  @Recortar()
  @MaxLength(60, { message: 'El apellido puede tener hasta 60 letras' })
  @MinLength(2, { message: 'El apellido tiene que tener al menos 2 letras' })
  @IsString({ message: 'El apellido es un texto' })
  apellido?: string;

  @IsOptional()
  @Recortar()
  @MaxLength(60, { message: 'Los nombres pueden tener hasta 60 letras' })
  @MinLength(2, { message: 'Los nombres tienen que tener al menos 2 letras' })
  @IsString({ message: 'Los nombres son un texto' })
  nombres?: string;

  @IsOptional()
  @Matches(/^\d{7,8}$/, { message: 'Ingresá un DNI de 7 u 8 dígitos' })
  dni?: string;

  @IsOptional()
  @Matches(/^(20|23|24|27)\d{9}$/, {
    message: 'El CUIL tiene 11 dígitos y empieza con 20, 23, 24 o 27',
  })
  cuil?: string;

  @IsOptional()
  @MaxLength(80, { message: 'La ocupación puede tener hasta 80 caracteres' })
  @IsString({ message: 'La ocupación es un texto' })
  ocupacion?: string;

  @IsOptional()
  @IsEnum(caracter_laboral, {
    message: 'El carácter es permanente, contratado o independiente',
  })
  caracter?: caracter_laboral;

  @IsOptional()
  @IsEnum(nivel_estudio, {
    message: 'El nivel es primario, secundario, terciario o universitario',
  })
  nivel_estudio?: nivel_estudio;

  @IsOptional()
  @IsEnum(estado_estudio, { message: 'El estudio es completo o incompleto' })
  estado_estudio?: estado_estudio;

  @IsOptional()
  @EsTelefono()
  telefono?: string;

  @IsOptional()
  @EsTelefono()
  telefono_alternativo?: string;

  @IsOptional()
  @MaxLength(100, { message: 'El mail puede tener hasta 100 caracteres' })
  @IsEmail(
    {},
    { message: 'Revisá el mail: tiene que ser como nombre@gmail.com' },
  )
  mail?: string;

  @IsOptional()
  @Recortar()
  @MaxLength(80, { message: 'La calle puede tener hasta 80 caracteres' })
  @MinLength(3, { message: 'Escribí el nombre de la calle' })
  @IsString({ message: 'La calle es un texto' })
  domicilio_calle?: string;

  @IsOptional()
  @Matches(/^(\d{1,5}|S\/N)$/, {
    message: 'El número de casa es un número o S/N',
  })
  domicilio_numero?: string;

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

  @IsOptional()
  @IsEnum(plan_social, {
    message: 'El plan social es no, asignacion_universal u otro_plan_social',
  })
  plan_social?: plan_social;
}
