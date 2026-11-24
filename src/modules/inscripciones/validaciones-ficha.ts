// Reglas de la ficha que no se pueden controlar con decoradores,
// y la búsqueda sin tildes del listado.
// Son las mismas que usa el front (cuil.js y validarInscripcion.js)
// y que controla la base (la función cuil_valido y el trigger de la edad).

const PESOS_CUIL = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

// El último dígito del CUIL se calcula con los diez anteriores.
// Del tercero al décimo va el DNI, así que también tienen que coincidir.
export function cuilValido(cuil: string, dni: string): boolean {
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += Number(cuil[i]) * PESOS_CUIL[i];
  }
  const resto = suma % 11;
  const digito = resto === 0 ? 0 : 11 - resto;

  const dniDelCuil = Number(cuil.slice(2, 10));
  return (
    digito !== 10 && digito === Number(cuil[10]) && dniDelCuil === Number(dni)
  );
}

// Los años que tiene el alumno el 30 de junio del ciclo lectivo.
// Las fechas AAAA-MM-DD se leen en UTC, así que todo se compara en UTC.
export function edadEnElCiclo(fechaNacimiento: string, ciclo: number): number {
  const nacimiento = new Date(fechaNacimiento);
  const referencia = new Date(Date.UTC(ciclo, 5, 30)); // 5 es junio: los meses van de 0 a 11

  let edad = referencia.getUTCFullYear() - nacimiento.getUTCFullYear();
  const todaviaNoCumplio =
    referencia.getUTCMonth() < nacimiento.getUTCMonth() ||
    (referencia.getUTCMonth() === nacimiento.getUTCMonth() &&
      referencia.getUTCDate() < nacimiento.getUTCDate());
  if (todaviaNoCumplio) {
    edad = edad - 1;
  }
  return edad;
}

// 'Pérez, Martina' → 'perez, martina', igual que normalizarTexto.js del front.
// normalize('NFD') separa cada letra de su tilde, y el replace borra las tildes sueltas.
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
