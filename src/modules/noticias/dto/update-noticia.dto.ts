import { PartialType } from '@nestjs/mapped-types';
import { CreateNoticiaDto } from './create-noticia.dto.js';

export class UpdateNoticiaDto extends PartialType(CreateNoticiaDto) {}
