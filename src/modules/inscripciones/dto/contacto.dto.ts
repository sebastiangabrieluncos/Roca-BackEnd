import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Recortar } from '../../../common/decorators/recortar.decorator.js';
import { EsTelefono } from '../../../common/decorators/es-telefono.decorator.js';

// Un contacto de emergencia: paso 5 de la ficha.
// Cada contacto que se manda tiene que venir completo.

export class ContactoDto {
  @Recortar()
  @MaxLength(60, { message: 'El apellido puede tener hasta 60 letras' })
  @MinLength(2, { message: 'El apellido tiene que tener al menos 2 letras' })
  @IsString({ message: 'El apellido del contacto es obligatorio' })
  apellido: string;

  @Recortar()
  @MaxLength(60, { message: 'Los nombres pueden tener hasta 60 letras' })
  @MinLength(2, { message: 'Los nombres tienen que tener al menos 2 letras' })
  @IsString({ message: 'Los nombres del contacto son obligatorios' })
  nombres: string;

  @Recortar()
  @MaxLength(30, { message: 'El parentesco puede tener hasta 30 caracteres' })
  @MinLength(1, { message: 'El parentesco es obligatorio' })
  @IsString({ message: 'El parentesco es obligatorio' })
  parentesco: string;

  @EsTelefono()
  @IsString({ message: 'El teléfono del contacto es obligatorio' })
  telefono: string;

  @IsOptional()
  @EsTelefono()
  telefono_alternativo?: string;
}
