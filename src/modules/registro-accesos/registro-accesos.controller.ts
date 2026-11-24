import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RegistroAccesosService } from './registro-accesos.service.js';
import { CreateRegistroAccesoDto } from './dto/create-registro-acceso.dto.js';
import { FiltrosRegistroDto } from './dto/filtros-registro.dto.js';

// Sin PATCH ni DELETE: un registro de control no se modifica ni se borra
@Controller('registro-accesos')
export class RegistroAccesosController {
  constructor(
    private readonly registroAccesosService: RegistroAccesosService,
  ) {}

  @Post()
  create(@Body() createRegistroAccesoDto: CreateRegistroAccesoDto) {
    return this.registroAccesosService.create(createRegistroAccesoDto);
  }

  @Get()
  findAll(@Query() filtros: FiltrosRegistroDto) {
    return this.registroAccesosService.findAll(filtros);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.registroAccesosService.findOne(id);
  }
}
