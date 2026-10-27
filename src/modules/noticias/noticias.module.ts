import { Module } from '@nestjs/common';
import { NoticiasService } from './noticias.service.js';
import { NoticiasController } from './noticias.controller.js';

@Module({
  controllers: [NoticiasController],
  providers: [NoticiasService],
})
export class NoticiasModule {}
