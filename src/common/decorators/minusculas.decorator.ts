import { Transform } from 'class-transformer';

// Saca los espacios de los costados y pasa el texto a minúsculas antes de validarlo.
// La base guarda el usuario y el mail en minúsculas, para que "Admin" y "admin"
// no puedan ser dos cuentas distintas.
export function Minusculas() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}
