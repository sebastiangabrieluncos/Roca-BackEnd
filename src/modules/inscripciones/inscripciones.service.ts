import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto.js';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto.js';
import { FiltrosInscripcionDto } from './dto/filtros-inscripcion.dto.js';
import { ContactoDto } from './dto/contacto.dto.js';
import {
  cuilValido,
  edadEnElCiclo,
  normalizarTexto,
} from './validaciones-ficha.js';

// El alta y la edición reciben la misma ficha: solo cambia quién la carga
type Ficha = CreateInscripcionDto | UpdateInscripcionDto;

const DEL_TUTOR = { padre: 'del padre', madre: 'de la madre' };

// Lo que se trae de cada inscripción cuando se muestra la ficha completa
const FICHA_COMPLETA = {
  alumno: {
    include: { provincia: true, alumno_tutor: { include: { tutor: true } } },
  },
  grado: true,
  vivienda: true,
  contacto_emergencia: { orderBy: { orden: 'asc' } },
  cargada_por: { select: { id: true, nombres: true, apellido: true } },
  actualizada_por: { select: { id: true, nombres: true, apellido: true } },
} satisfies Prisma.inscripcionInclude;

@Injectable()
export class InscripcionesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInscripcionDto) {
    await this.validarFicha(dto, dto.cargada_por_id);
    await this.validarQueNoEsteInscripto(dto.alumno.dni, dto.ciclo_lectivo);

    // Todo o nada: si falla algún paso, no queda nada guardado a medias
    const inscripcion = await this.prisma.$transaction(async (tx) => {
      // Si el alumno ya estuvo en otro ciclo, se reutiliza y se actualizan sus datos
      const alumno = await tx.alumno.upsert({
        where: { dni: dto.alumno.dni },
        create: this.datosDelAlumno(dto),
        update: this.datosDelAlumno(dto),
      });

      await this.guardarTutores(tx, alumno.id, dto);

      return tx.inscripcion.create({
        data: {
          alumno_id: alumno.id,
          grado_id: dto.grado_id,
          ciclo_lectivo: dto.ciclo_lectivo,
          repitente: dto.repitente,
          escuela_origen: dto.escuela_origen,
          cantidad_hermanos: dto.cantidad_hermanos,
          cargada_por_id: dto.cargada_por_id,
          vivienda: { create: dto.vivienda },
          contacto_emergencia: {
            create: this.contactosConOrden(dto.contactos),
          },
        },
      });
    });

    return this.findOne(inscripcion.id);
  }

  async findAll(filtros: FiltrosInscripcionDto) {
    // Lo que llega en undefined, Prisma no lo usa para filtrar
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { ciclo_lectivo: filtros.ciclo, grado_id: filtros.grado_id },
      include: { alumno: true, grado: true },
      orderBy: [
        { alumno: { apellido: 'asc' } },
        { alumno: { nombres: 'asc' } },
      ],
    });

    if (!filtros.buscar) {
      return inscripciones;
    }

    // La búsqueda funciona igual que en el panel del front: sin importar tildes
    // ni mayúsculas, y cada palabra tiene que estar en el apellido, los nombres o el DNI
    const palabras = normalizarTexto(filtros.buscar).split(' ').filter(Boolean);
    return inscripciones.filter(({ alumno }) => {
      const textoAlumno = normalizarTexto(
        `${alumno.apellido} ${alumno.nombres} ${alumno.dni}`,
      );
      return palabras.every((palabra) => textoAlumno.includes(palabra));
    });
  }

  async findOne(id: number) {
    const inscripcion = await this.prisma.inscripcion.findUnique({
      where: { id },
      include: FICHA_COMPLETA,
    });

    if (!inscripcion) {
      throw new NotFoundException(`No existe la inscripción ${id}`);
    }

    return inscripcion;
  }

  async update(id: number, dto: UpdateInscripcionDto) {
    const actual = await this.findOne(id);
    await this.validarFicha(dto, dto.actualizada_por_id);
    await this.validarQueNoEsteInscripto(dto.alumno.dni, dto.ciclo_lectivo, id);
    await this.validarDniDeOtroAlumno(dto.alumno.dni, actual.alumno_id);

    await this.prisma.$transaction(async (tx) => {
      await tx.alumno.update({
        where: { id: actual.alumno_id },
        data: this.datosDelAlumno(dto),
      });
      await this.guardarTutores(tx, actual.alumno_id, dto);
      await tx.vivienda.update({
        where: { inscripcion_id: id },
        data: dto.vivienda,
      });

      // Los contactos se reemplazan: se borran los anteriores y se cargan los nuevos
      await tx.contacto_emergencia.deleteMany({
        where: { inscripcion_id: id },
      });
      await tx.inscripcion.update({
        where: { id },
        data: {
          grado_id: dto.grado_id,
          ciclo_lectivo: dto.ciclo_lectivo,
          repitente: dto.repitente,
          escuela_origen: dto.escuela_origen,
          cantidad_hermanos: dto.cantidad_hermanos,
          actualizada_por_id: dto.actualizada_por_id,
          actualizada_el: new Date(),
          contacto_emergencia: {
            create: this.contactosConOrden(dto.contactos),
          },
        },
      });
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    // La vivienda y los contactos se borran solos (ON DELETE CASCADE).
    // El alumno queda, porque puede tener inscripciones de otros ciclos.
    return this.prisma.inscripcion.delete({ where: { id } });
  }

  // Lo que muestra el tablero del front: el total del ciclo y,
  // por cada grado, cuántos inscriptos hay y cuántos de cada sexo
  async estadisticas(ciclo: number) {
    const grados = await this.prisma.grado.findMany({
      orderBy: { orden: 'asc' },
    });
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { ciclo_lectivo: ciclo },
      select: { grado_id: true, alumno: { select: { sexo: true } } },
    });

    const porGrado = grados.map((grado) => {
      const delGrado = inscripciones.filter((i) => i.grado_id === grado.id);
      return {
        grado: grado.nombre,
        total: delGrado.length,
        femenino: delGrado.filter((i) => i.alumno.sexo === 'femenino').length,
        masculino: delGrado.filter((i) => i.alumno.sexo === 'masculino').length,
        x: delGrado.filter((i) => i.alumno.sexo === 'x').length,
      };
    });

    return { ciclo, total: inscripciones.length, por_grado: porGrado };
  }

  // Las reglas de la ficha que dependen de la base o de otros datos
  private async validarFicha(dto: Ficha, usuarioId: number) {
    const grado = await this.prisma.grado.findUnique({
      where: { id: dto.grado_id },
    });
    if (!grado) {
      throw new BadRequestException(`No existe el grado ${dto.grado_id}`);
    }

    const provinciaId = dto.alumno.provincia_nacimiento_id;
    if (provinciaId !== undefined) {
      const provincia = await this.prisma.provincia.findUnique({
        where: { id: provinciaId },
      });
      if (!provincia) {
        throw new BadRequestException(`No existe la provincia ${provinciaId}`);
      }
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    // Quien carga o modifica la ficha tiene que ser una cuenta activa
    if (!usuario || !usuario.activo) {
      throw new BadRequestException(
        `El usuario ${usuarioId} no existe o tiene la cuenta desactivada`,
      );
    }

    // El alumno: la fecha de nacimiento, la edad en el ciclo y el CUIL
    const { alumno } = dto;
    if (new Date(alumno.fecha_nacimiento) > new Date()) {
      throw new BadRequestException(
        'La fecha de nacimiento no puede ser posterior a hoy',
      );
    }

    const edad = edadEnElCiclo(alumno.fecha_nacimiento, dto.ciclo_lectivo);
    if (edad < 3 || edad > 14) {
      throw new BadRequestException(
        `Revisá la fecha: el alumno tendría ${edad} años en el ciclo ${dto.ciclo_lectivo}, y la escuela recibe de 3 a 14`,
      );
    }

    if (alumno.cuil && !cuilValido(alumno.cuil, alumno.dni)) {
      throw new BadRequestException(
        'El CUIL del alumno no es válido o no coincide con su DNI',
      );
    }

    // El responsable tiene que venir con sus datos obligatorios
    const responsable = dto[dto.responsable];
    if (
      !responsable?.apellido ||
      !responsable.nombres ||
      !responsable.dni ||
      !responsable.telefono
    ) {
      throw new BadRequestException(
        `Completá apellido, nombres, DNI y teléfono ${DEL_TUTOR[dto.responsable]}: figura como responsable`,
      );
    }

    // El padre y la madre: el DNI y el CUIL
    for (const vinculo of ['padre', 'madre'] as const) {
      const tutor = dto[vinculo];
      if (!tutor) {
        continue;
      }
      if (tutor.dni && tutor.dni === alumno.dni) {
        throw new BadRequestException(
          `El DNI ${DEL_TUTOR[vinculo]} no puede ser el mismo que el del alumno`,
        );
      }
      if (tutor.cuil && !tutor.dni) {
        throw new BadRequestException(
          `Si cargás el CUIL ${DEL_TUTOR[vinculo]}, cargá también su DNI`,
        );
      }
      if (tutor.cuil && tutor.dni && !cuilValido(tutor.cuil, tutor.dni)) {
        throw new BadRequestException(
          `El CUIL ${DEL_TUTOR[vinculo]} no es válido o no coincide con su DNI`,
        );
      }
    }

    if (dto.padre?.dni && dto.padre.dni === dto.madre?.dni) {
      throw new BadRequestException(
        'El padre y la madre no pueden tener el mismo DNI',
      );
    }
  }

  // Un alumno tiene una sola inscripción por ciclo.
  // Al editar, se ignora la inscripción que se está editando.
  private async validarQueNoEsteInscripto(
    dni: string,
    ciclo: number,
    idActual?: number,
  ) {
    const existente = await this.prisma.inscripcion.findFirst({
      where: { ciclo_lectivo: ciclo, alumno: { dni } },
      select: { id: true },
    });

    if (existente && existente.id !== idActual) {
      throw new ConflictException(
        `Ya hay una inscripción de ese DNI para el ciclo ${ciclo}`,
      );
    }
  }

  // Al editar, el DNI nuevo no puede ser el de otro alumno
  private async validarDniDeOtroAlumno(dni: string, alumnoId: number) {
    const otro = await this.prisma.alumno.findUnique({
      where: { dni },
      select: { id: true },
    });

    if (otro && otro.id !== alumnoId) {
      throw new ConflictException('Ya hay otro alumno con ese DNI');
    }
  }

  // Borra los vínculos anteriores del alumno y guarda el padre y la madre que vinieron.
  // Así, al reinscribir o editar, la ficha queda igual a la que se mandó.
  private async guardarTutores(
    tx: Prisma.TransactionClient,
    alumnoId: number,
    dto: Ficha,
  ) {
    await tx.alumno_tutor.deleteMany({ where: { alumno_id: alumnoId } });

    for (const vinculo of ['padre', 'madre'] as const) {
      const datos = dto[vinculo];
      // Un tutor sin apellido, nombres ni DNI no se guarda (la base tampoco lo acepta)
      if (!datos || (!datos.apellido && !datos.nombres && !datos.dni)) {
        continue;
      }

      // Con DNI, se busca por si ya está cargado (por ejemplo, por un hermano)
      const tutor = datos.dni
        ? await tx.tutor.upsert({
            where: { dni: datos.dni },
            create: datos,
            update: datos,
          })
        : await tx.tutor.create({ data: datos });

      await tx.alumno_tutor.create({
        data: {
          alumno_id: alumnoId,
          tutor_id: tutor.id,
          vinculo,
          es_responsable: vinculo === dto.responsable,
        },
      });
    }
  }

  // La fecha llega como texto AAAA-MM-DD y Prisma la guarda como Date
  private datosDelAlumno(dto: Ficha) {
    return {
      ...dto.alumno,
      fecha_nacimiento: new Date(dto.alumno.fecha_nacimiento),
    };
  }

  // El orden de cada contacto (1 o 2) sale de su lugar en la lista
  private contactosConOrden(contactos: ContactoDto[]) {
    return contactos.map((contacto, indice) => ({
      ...contacto,
      orden: indice + 1,
    }));
  }
}
