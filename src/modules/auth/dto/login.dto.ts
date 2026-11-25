import { IsString, MaxLength, MinLength } from 'class-validator';
import { Minusculas } from '../../../common/decorators/minusculas.decorator.js';

// Los datos del login. En cada campo, los decoradores se revisan de abajo hacia arriba.
export class LoginDto {
  // Sirve el nombre de usuario o el mail, como en el front
  @Minusculas()
  @MaxLength(100, {
    message: 'El usuario o mail puede tener hasta 100 caracteres',
  })
  @MinLength(1, { message: 'Ingresá tu usuario o tu mail' })
  @IsString({ message: 'Ingresá tu usuario o tu mail' })
  usuario: string;

  @MaxLength(128, { message: 'La contraseña puede tener hasta 128 caracteres' })
  @MinLength(1, { message: 'Ingresá tu contraseña' })
  @IsString({ message: 'Ingresá tu contraseña' })
  password: string;
}
