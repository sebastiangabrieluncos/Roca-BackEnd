import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service.js';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto.js';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto.js';
import { FiltrosInscripcionDto } from './dto/filtros-inscripcion.dto.js';

@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  create(@Body() createInscripcionDto: CreateInscripcionDto) {
    return this.inscripcionesService.create(createInscripcionDto);
  }

  @Get()
  findAll(@Query() filtros: FiltrosInscripcionDto) {
    return this.inscripcionesService.findAll(filtros);
  }

  @Get('estadisticas')
  estadisticas(@Query('ciclo', ParseIntPipe) ciclo: number) {
    return this.inscripcionesService.estadisticas(ciclo);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInscripcionDto: UpdateInscripcionDto,
  ) {
    return this.inscripcionesService.update(id, updateInscripcionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.remove(id);
  }
}
