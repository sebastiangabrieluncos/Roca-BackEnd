# Roca · Back End

API del sistema de inscripción de alumnos y del portal de noticias de la Escuela Presidente Julio A. Roca (San Miguel de Tucumán). Trabajo Final Integrador de la Tecnicatura Universitaria en Programación, UTN FRT.

El front está en [Roca-FrontEnd](https://github.com/nachovalverde/Roca-FrontEnd) y publicado en [roca-front-end.vercel.app](https://roca-front-end.vercel.app).

## Tecnologías

- NestJS 12 y TypeScript
- PostgreSQL
- Prisma 7 con @prisma/adapter-pg
- class-validator y class-transformer
- JWT y bcrypt (TP 12)

## Requisitos

- Node.js 20 o superior
- PostgreSQL y pgAdmin
- Git

## Instalación

bash
git clone https://github.com/sebastiangabrieluncos/Roca-BackEnd.git
cd Roca-BackEnd
npm install


Copiar .env.example como .env y completar la contraseña de PostgreSQL:

| Variable | Para qué |
| --- | --- |
| PORT | Puerto de la API (4000) |
| DATABASE_URL | Conexión a PostgreSQL |
| API_BASE_URL | Dirección base de la API |
| `JWT_SECRET` | Clave con la que la API firma los tokens del login |

## Base de datos

La base roca_db tiene 15 tablas en tercera forma normal. La estructura está en prisma/migrations/0_init/migration.sql y los datos de prueba en prisma/datos_demo.sql. El diagrama está en docs/der-roca.png.

1. En pgAdmin, crear una base vacía llamada roca_db.
2. Crear las tablas, los catálogos y las cuentas de prueba:

   bash
   npx prisma migrate deploy
   npx prisma generate
   

3. En la Herramienta de consulta de roca_db, ejecutar prisma/datos_demo.sql.

Si la base se creó con los scripts SQL originales, en lugar de migrate deploy se corre una sola vez npx prisma migrate resolve --applied 0_init.

## Cómo levantar la API

bash
npm run start:dev


Queda en http://localhost:4000.

| Script | Qué hace |
| --- | --- |
| npm run start:dev | Levanta la API y la reinicia con cada cambio |
| npm run build | Compila a dist |
| npm run lint | Revisa el código con oxlint |
| npm run format | Formatea el código con Prettier |

## Estructura


prisma/
  schema.prisma       modelos leídos de la base
  migrations/         historial de la estructura
  datos_demo.sql      datos de prueba
src/
  main.ts
  modules/
    app/              módulo raíz
    prisma/           conexión a la base
    catalogos/        listas fijas de los formularios
    inscripciones/
    noticias/
    registro-accesos/
    usuarios/
    auth/
  generated/prisma/   cliente de Prisma (no se sube)
postman/              colección para probar la API
docs/                 diagrama de la base


## Módulos

| Módulo | Qué hace |
| --- | --- |
| inscripciones | Ficha completa del alumno: alta, listado con filtros, detalle, edición y baja |
| catalogos | Grados, roles, provincias, categorías y tipos de evento, de solo lectura |
| noticias | Alta, edición, publicación y baja de noticias del portal |
| registro-accesos | Ingresos, intentos fallidos, salidas y cambios de cuentas |
| usuarios | Cuentas de la escuela, con contraseñas hasheadas |
| auth | Inicio de sesión con JWT |
| prisma | Conexión a PostgreSQL para todos los módulos |
| app | Módulo raíz |

## Cuentas de prueba

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| admin | admin123 | Vicedirección |
| secretario | secretario123 | Secretaría |
| maestra1 | maestra123 | Maestra de 1° |
| hcarrizo | maestro123 | Maestro con la cuenta desactivada |

## Autenticación

`POST /auth/login` recibe el usuario (o el mail) y la contraseña:

    { "usuario": "admin", "password": "admin123" }

Si son correctos, devuelve un `access_token` (JWT, dura 1 hora) y los datos de la cuenta, sin la contraseña. Cada intento, bueno o malo, queda en el registro de accesos.

No hay una ruta de registro público: en la escuela, las cuentas las crea la vicedirección con `POST /usuarios`, y esa es la única ruta para crear cuentas, como pide el TP 12. Las contraseñas se guardan hasheadas con bcrypt.

## Postman

Importar postman/Roca-API.postman_collection.json. La variable baseUrl apunta a http://localhost:4000.

## Cómo trabajamos

- `dev` es la rama por defecto y tiene la versión final del back; `main` quedó con la estructura inicial del proyecto.
- Una rama por tarea, desde dev: feature/, fix/, refactor/ o docs/.
- Commits con el formato tipo: qué cambia y para qué.
- Todo entra a dev por Pull Request, con la revisión del otro integrante.

## Integrantes

- Sebastián Uncos: inscripciones, catálogos y base de datos.
- José Ignacio Valverde: portal, noticias, usuarios y autenticación.