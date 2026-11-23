import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RegistroAccesosService } from './registro-accesos.service.js';
import { CreateRegistroAccesoDto } from './dto/create-registro-acceso.dto.js';
import { UpdateRegistroAccesoDto } from './dto/update-registro-acceso.dto.js';

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
  findAll() {
    return this.registroAccesosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registroAccesosService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRegistroAccesoDto: UpdateRegistroAccesoDto,
  ) {
    return this.registroAccesosService.update(+id, updateRegistroAccesoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registroAccesosService.remove(+id);
  }
}
