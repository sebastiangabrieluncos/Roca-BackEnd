import { applyDecorators } from '@nestjs/common';
import { Matches, MaxLength } from 'class-validator';

// Las mismas reglas que el front y que la función telefono_valido de la base:
// solo números, espacios y los signos + - /, con al menos 7 dígitos.
// Se revisan en este orden y se muestra el primer error.
export function EsTelefono() {
  return applyDecorators(
    Matches(/^[0-9 +/-]+$/, {
      message: 'El teléfono solo puede tener números, espacios y + - /',
    }),
    Matches(/(\D*\d){7}/, {
      message: 'Ingresá un teléfono completo (7 dígitos o más)',
    }),
    MaxLength(20, { message: 'El teléfono puede tener hasta 20 caracteres' }),
  );
}