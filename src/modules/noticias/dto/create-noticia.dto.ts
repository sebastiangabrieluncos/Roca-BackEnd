import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Recortar } from '../../../common/decorators/recortar.decorator.js';

// Una noticia del portal, con las mismas reglas que validarNoticia.js del front.

export class CreateNoticiaDto {
  @Recortar()
  @Length(5, 100, { message: 'El título debe tener entre 5 y 100 caracteres' })
  @IsString({ message: 'El título es obligatorio' })
  titulo: string;

  // El resumen que se ve en la tarjeta
  @Recortar()
  @MaxLength(200, { message: 'El resumen puede tener hasta 200 caracteres' })
  @MinLength(1, { message: 'Completá el resumen' })
  @IsString({ message: 'Completá el resumen' })
  descripcion: string;

  // El texto completo que se ve en el detalle
  @Recortar()
  @MinLength(1, { message: 'Completá el contenido de la noticia' })
  @IsString({ message: 'Completá el contenido de la noticia' })
  contenido: string;

  @IsOptional()
  @MaxLength(500, { message: 'La dirección de la imagen es demasiado larga' })
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'La imagen debe tener una dirección que empiece con https://' },
  )
  imagen_url?: string;

  @IsInt({ message: 'La categoría tiene que ser el id de una categoría' })
  categoria_id: number;

  // Quién escribe la noticia. Desde el TP 12 va a salir del login
  @IsInt({ message: 'autor_id tiene que ser el id de un usuario' })
  autor_id: number;

  // Si no se manda, la noticia queda como borrador, igual que en el front
  @IsOptional()
  @IsBoolean({ message: 'Publicada tiene que ser true o false' })
  publicada?: boolean;
}
