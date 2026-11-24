import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Recortar } from '../../../common/decorators/recortar.decorator.js';

// Un evento del registro de accesos: un ingreso, una salida, un alta de cuenta

export class CreateRegistroAccesoDto {
  @IsInt({ message: 'tipo_evento_id tiene que ser el id de un tipo de evento' })
  tipo_evento_id: number;

  // La cuenta a la que corresponde el evento, si existe
  @IsOptional()
  @IsInt({ message: 'usuario_id tiene que ser el id de un usuario' })
  usuario_id?: number;

  // Lo que se escribió en el login cuando la cuenta no existe.
  // Se revisa si no vino usuario_id (entonces es obligatorio, como pide la base)
  // o si vino igual (entonces se revisa su largo).
  @ValidateIf((dto) => !dto.usuario_id || dto.usuario_ingresado !== undefined)
  @Recortar()
  @MaxLength(100, {
    message: 'El usuario ingresado puede tener hasta 100 caracteres',
  })
  @MinLength(1, { message: 'Indicá usuario_id o usuario_ingresado' })
  @IsString({ message: 'Indicá usuario_id o usuario_ingresado' })
  usuario_ingresado?: string;

  @IsOptional()
  @MaxLength(255, { message: 'El detalle puede tener hasta 255 caracteres' })
  @IsString({ message: 'El detalle es un texto' })
  detalle?: string;
}
