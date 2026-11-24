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
import { NoticiasService } from './noticias.service.js';
import { CreateNoticiaDto } from './dto/create-noticia.dto.js';
import { UpdateNoticiaDto } from './dto/update-noticia.dto.js';

@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Post()
  create(@Body() createNoticiaDto: CreateNoticiaDto) {
    return this.noticiasService.create(createNoticiaDto);
  }

  // GET /noticias trae todas (administración) y
  // GET /noticias?publicadas=true, solo las del portal.
  // Lo que llega por la URL es texto: por eso se compara con 'true'
  @Get()
  findAll(@Query('publicadas') publicadas?: string) {
    return this.noticiasService.findAll(publicadas === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticiasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoticiaDto: UpdateNoticiaDto,
  ) {
    return this.noticiasService.update(id, updateNoticiaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.noticiasService.remove(id);
  }
}
