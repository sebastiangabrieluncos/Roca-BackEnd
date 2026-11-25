import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Recortar } from '../../../common/decorators/recortar.decorator.js';
import { Minusculas } from '../../../common/decorators/minusculas.decorator.js';

// Una cuenta de la escuela, con las mismas reglas que validarUsuario.js del front.
// En cada campo, los decoradores se revisan de abajo hacia arriba.
export class CreateUsuarioDto {
  @Recortar()
  @MaxLength(60, { message: 'Los nombres pueden tener hasta 60 letras' })
  @MinLength(2, { message: 'Los nombres tienen que tener al menos 2 letras' })
  @IsString({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @Recortar()
  @MaxLength(60, { message: 'El apellido puede tener hasta 60 letras' })
  @MinLength(2, { message: 'El apellido tiene que tener al menos 2 letras' })
  @IsString({ message: 'El apellido es obligatorio' })
  apellido: string;

  @Minusculas()
  @Matches(/^[a-z0-9._-]{4,20}$/, {
    message:
      'Usá entre 4 y 20 caracteres: letras, números, punto, guion o guion bajo',
  })
  @IsString({ message: 'El usuario es obligatorio' })
  usuario: string;

  @Minusculas()
  @MaxLength(100, { message: 'El mail puede tener hasta 100 caracteres' })
  @IsEmail({}, { message: 'Revisá el mail: debe tener @ y un dominio' })
  mail: string;

  // Mínimo 8 caracteres, con al menos una letra y un número.
  // Hasta 72, porque bcrypt no usa lo que pase de ahí.
  @Matches(/\d/, {
    message: 'La contraseña tiene que tener al menos una letra y un número',
  })
  @Matches(/\p{L}/u, {
    message: 'La contraseña tiene que tener al menos una letra y un número',
  })
  @MaxLength(72, { message: 'La contraseña puede tener hasta 72 caracteres' })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @IsString({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsInt({ message: 'El rol tiene que ser el id de un rol' })
  rol_id: number;

  // Obligatorio solo para los maestros: lo controla el service
  @IsOptional()
  @IsInt({ message: 'El grado tiene que ser el id de un grado' })
  grado_id?: number;

  // Quién crea la cuenta. Cuando se protejan las rutas, va a salir del login
  @IsInt({ message: 'hecho_por_id tiene que ser el id de un usuario' })
  hecho_por_id: number;
}
