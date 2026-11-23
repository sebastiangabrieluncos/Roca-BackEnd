import { PartialType } from '@nestjs/mapped-types';
import { CreateRegistroAccesoDto } from './create-registro-acceso.dto.js';

export class UpdateRegistroAccesoDto extends PartialType(
  CreateRegistroAccesoDto,
) {}
