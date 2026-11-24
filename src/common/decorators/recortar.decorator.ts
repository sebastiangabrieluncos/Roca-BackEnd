import { Transform } from 'class-transformer';

export function Recortar() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
