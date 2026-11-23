import { Injectable } from '@nestjs/common';
import { CreateRegistroAccesoDto } from './dto/create-registro-acceso.dto.js';
import { UpdateRegistroAccesoDto } from './dto/update-registro-acceso.dto.js';

@Injectable()
export class RegistroAccesosService {
  create(createRegistroAccesoDto: CreateRegistroAccesoDto) {
    return 'This action adds a new registroAcceso';
  }

  findAll() {
    return `This action returns all registroAccesos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} registroAcceso`;
  }

  update(id: number, updateRegistroAccesoDto: UpdateRegistroAccesoDto) {
    return `This action updates a #${id} registroAcceso`;
  }

  remove(id: number) {
    return `This action removes a #${id} registroAcceso`;
  }
}
