-- =====================================================================
--  ROCA · Base de datos relacional en 3FN (PostgreSQL)
--  Archivo 1 de 2: ESTRUCTURA + catálogos + usuarios de prueba
--  Ejecutar completo (F5) con la Herramienta de consulta abierta sobre
--  la base roca_db. Va en una transacción: si algo falla, no queda nada.
--
--  Cada largo máximo y cada control replica las validaciones del front
--  (maxLength de los inputs + utils/validarInscripcion.js,
--  validarUsuario.js y validarNoticia.js).
-- =====================================================================


-- =====================================================================
-- BLOQUE 1 · Extensión, tipos enumerados y funciones de control
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- hashea las contraseñas de prueba (bcrypt)

-- Opciones fijas de los formularios (data/opcionesFicha.js).
-- El back traduce: 'Femenino' -> femenino, 'Asignación Universal' -> asignacion_universal, etc.
CREATE TYPE sexo              AS ENUM ('femenino', 'masculino', 'x');
CREATE TYPE vinculo_tutor     AS ENUM ('padre', 'madre');
CREATE TYPE caracter_laboral  AS ENUM ('permanente', 'contratado', 'independiente');
CREATE TYPE nivel_estudio     AS ENUM ('primario', 'secundario', 'terciario', 'universitario');
CREATE TYPE estado_estudio    AS ENUM ('completo', 'incompleto');
CREATE TYPE plan_social       AS ENUM ('no', 'asignacion_universal', 'otro_plan_social');
CREATE TYPE tenencia_vivienda AS ENUM ('propia', 'alquilada', 'otros');
CREATE TYPE tipo_vivienda     AS ENUM ('material', 'prefabricada', 'otros');

-- CUIL válido (utils/cuil.js): prefijo 20, 23, 24 o 27, dígito verificador
-- correcto y, si hay DNI, que el CUIL lleve ese DNI adentro.
CREATE FUNCTION cuil_valido(p_cuil TEXT, p_dni TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  pesos INT[] := ARRAY[5,4,3,2,7,6,5,4,3,2];
  suma  INT := 0;
  resto INT;
  digito INT;
BEGIN
  IF p_cuil IS NULL THEN RETURN TRUE; END IF;
  IF p_cuil !~ '^(20|23|24|27)[0-9]{9}$' THEN RETURN FALSE; END IF;
  FOR i IN 1..10 LOOP
    suma := suma + substr(p_cuil, i, 1)::INT * pesos[i];
  END LOOP;
  resto  := suma % 11;
  digito := CASE WHEN resto = 0 THEN 0 ELSE 11 - resto END;
  IF digito = 10 OR digito <> substr(p_cuil, 11, 1)::INT THEN RETURN FALSE; END IF;
  IF p_dni IS NOT NULL AND substr(p_cuil, 3, 8)::INT <> p_dni::INT THEN RETURN FALSE; END IF;
  RETURN TRUE;
END $$;

-- Teléfono: solo dígitos, espacios, + - / (filtro soloTelefono) y al menos 7 dígitos
CREATE FUNCTION telefono_valido(p_tel TEXT) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE AS $$
  SELECT p_tel IS NULL
      OR (p_tel ~ '^[0-9 +/-]+$' AND length(regexp_replace(p_tel, '[^0-9]', '', 'g')) >= 7)
$$;

-- Mail: algo@algo.algo, sin espacios (mismo patrón que el front)
CREATE FUNCTION mail_valido(p_mail TEXT) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE AS $$
  SELECT p_mail IS NULL OR p_mail ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
$$;

-- =====================================================================
-- BLOQUE 2 · Catálogos (5 tablas)
-- =====================================================================
CREATE TABLE rol (
  id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,   -- el valor que usa el front (data/roles.js)
  nombre VARCHAR(40) NOT NULL           -- cómo se muestra en pantalla
);

CREATE TABLE grado (
  id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(10) NOT NULL UNIQUE,
  orden  SMALLINT    NOT NULL UNIQUE
);

-- El id es el código oficial (INDEC), el mismo que usa Georef
CREATE TABLE provincia (
  id     SMALLINT    PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE categoria_noticia (
  id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE tipo_evento (
  id     SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,   -- EVENTOS de registroAccesosService.js
  nombre VARCHAR(60) NOT NULL
);

-- =====================================================================
-- BLOQUE 3 · Usuarios y seguridad (3 tablas)  · FormularioUsuario.jsx
-- =====================================================================
CREATE TABLE usuario (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombres       VARCHAR(60)  NOT NULL,
  apellido      VARCHAR(60)  NOT NULL,
  usuario       VARCHAR(20)  NOT NULL UNIQUE,
  mail          VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id        SMALLINT     NOT NULL REFERENCES rol(id)   ON DELETE RESTRICT,
  grado_id      SMALLINT              REFERENCES grado(id) ON DELETE RESTRICT,  -- obligatorio para maestros (lo controla el back)
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_el     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_usuario_nombres  CHECK (length(trim(nombres))  >= 2),
  CONSTRAINT chk_usuario_apellido CHECK (length(trim(apellido)) >= 2),
  -- 4 a 20 caracteres: letras, números, punto, guion o guion bajo; se guarda en minúsculas
  -- para que 'Admin' y 'admin' no puedan ser dos cuentas distintas
  CONSTRAINT chk_usuario_formato  CHECK (usuario ~ '^[a-z0-9._-]{4,20}$'),
  CONSTRAINT chk_usuario_mail     CHECK (mail = lower(mail) AND mail_valido(mail))
);

CREATE TABLE registro_acceso (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha             TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo_evento_id    SMALLINT    NOT NULL REFERENCES tipo_evento(id) ON DELETE RESTRICT,
  usuario_id        INT                  REFERENCES usuario(id)     ON DELETE SET NULL,
  usuario_ingresado VARCHAR(100),   -- lo que se tipeó cuando el usuario no existe
  detalle           VARCHAR(255),
  CONSTRAINT chk_registro_quien CHECK (usuario_id IS NOT NULL OR usuario_ingresado IS NOT NULL)
);

CREATE TABLE codigo_recuperacion (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  INT          NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  codigo_hash VARCHAR(255) NOT NULL,
  vence_el    TIMESTAMPTZ  NOT NULL,                      -- 15 minutos después de pedirlo
  intentos    SMALLINT     NOT NULL DEFAULT 0,
  usado_el    TIMESTAMPTZ,
  creado_el   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_intentos CHECK (intentos BETWEEN 0 AND 3),
  CONSTRAINT chk_vence    CHECK (vence_el > creado_el)
);

-- =====================================================================
-- BLOQUE 4 · Noticias (1 tabla)  · FormularioNoticia.jsx
-- =====================================================================
CREATE TABLE noticia (
  id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo         VARCHAR(100) NOT NULL,
  descripcion    VARCHAR(200) NOT NULL,   -- el resumen de la tarjeta
  contenido      TEXT         NOT NULL,   -- el texto completo del detalle
  imagen_url     VARCHAR(500),
  categoria_id   SMALLINT     NOT NULL REFERENCES categoria_noticia(id) ON DELETE RESTRICT,
  autor_id       INT          NOT NULL REFERENCES usuario(id)           ON DELETE RESTRICT,
  publicada      BOOLEAN      NOT NULL DEFAULT FALSE,   -- el formulario arranca como borrador
  fecha          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizada_el TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_noticia_titulo      CHECK (length(trim(titulo)) BETWEEN 5 AND 100),
  CONSTRAINT chk_noticia_descripcion CHECK (length(trim(descripcion)) >= 1),
  CONSTRAINT chk_noticia_contenido   CHECK (length(trim(contenido)) >= 1),
  CONSTRAINT chk_noticia_imagen      CHECK (imagen_url IS NULL OR imagen_url ~* '^https://[^[:space:]]+$')
);

-- =====================================================================
-- BLOQUE 5 · Alumnos y tutores (3 tablas)  · PasoAlumno / DatosTutorForm
-- =====================================================================
CREATE TABLE alumno (
  id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  apellido                VARCHAR(60)  NOT NULL,
  nombres                 VARCHAR(60)  NOT NULL,
  dni                     VARCHAR(8)   NOT NULL UNIQUE,
  cuil                    VARCHAR(11)           UNIQUE,   -- opcional en el formulario
  sexo                    sexo         NOT NULL,
  fecha_nacimiento        DATE         NOT NULL,
  acta_nacimiento         VARCHAR(30),
  provincia_nacimiento_id SMALLINT     REFERENCES provincia(id) ON DELETE RESTRICT,
  lugar_nacimiento        VARCHAR(100),                   -- localidad de Georef
  domicilio_calle         VARCHAR(80)  NOT NULL,
  domicilio_numero        VARCHAR(5)   NOT NULL,
  domicilio_piso_depto    VARCHAR(20),
  domicilio_barrio        VARCHAR(60),
  CONSTRAINT chk_alumno_apellido CHECK (length(trim(apellido)) >= 2),
  CONSTRAINT chk_alumno_nombres  CHECK (length(trim(nombres))  >= 2),
  CONSTRAINT chk_alumno_dni      CHECK (dni ~ '^[0-9]{7,8}$'),
  CONSTRAINT chk_alumno_cuil     CHECK (cuil_valido(cuil, dni)),
  CONSTRAINT chk_alumno_calle    CHECK (length(trim(domicilio_calle)) >= 3),
  CONSTRAINT chk_alumno_numero   CHECK (domicilio_numero ~ '^([0-9]{1,5}|S/N)$')
);

-- Padre o madre. Solo el que figura como tutor tiene datos obligatorios
-- (apellido, nombres, DNI y teléfono: lo controla el back); del otro se
-- guarda lo que se haya completado.
CREATE TABLE tutor (
  id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  apellido             VARCHAR(60),
  nombres              VARCHAR(60),
  dni                  VARCHAR(8)   UNIQUE,
  cuil                 VARCHAR(11)  UNIQUE,
  ocupacion            VARCHAR(80),
  caracter             caracter_laboral,
  nivel_estudio        nivel_estudio,
  estado_estudio       estado_estudio,
  telefono             VARCHAR(20),
  telefono_alternativo VARCHAR(20),
  mail                 VARCHAR(100),
  domicilio_calle      VARCHAR(80),
  domicilio_numero     VARCHAR(5),
  domicilio_piso_depto VARCHAR(20),
  domicilio_barrio     VARCHAR(60),
  plan_social          plan_social,
  CONSTRAINT chk_tutor_identificado CHECK (apellido IS NOT NULL OR nombres IS NOT NULL OR dni IS NOT NULL),
  CONSTRAINT chk_tutor_apellido     CHECK (apellido IS NULL OR length(trim(apellido)) >= 2),
  CONSTRAINT chk_tutor_nombres      CHECK (nombres  IS NULL OR length(trim(nombres))  >= 2),
  CONSTRAINT chk_tutor_dni          CHECK (dni IS NULL OR dni ~ '^[0-9]{7,8}$'),
  CONSTRAINT chk_tutor_cuil         CHECK (cuil_valido(cuil, dni)),
  CONSTRAINT chk_tutor_telefono     CHECK (telefono_valido(telefono)),
  CONSTRAINT chk_tutor_telefono2    CHECK (telefono_valido(telefono_alternativo)),
  CONSTRAINT chk_tutor_mail         CHECK (mail_valido(mail)),
  CONSTRAINT chk_tutor_calle        CHECK (domicilio_calle IS NULL OR length(trim(domicilio_calle)) >= 3),
  CONSTRAINT chk_tutor_numero       CHECK (domicilio_numero IS NULL OR domicilio_numero ~ '^([0-9]{1,5}|S/N)$')
);

-- Relación N:M: un tutor puede tener varios hijos en la escuela
CREATE TABLE alumno_tutor (
  alumno_id      INT           NOT NULL REFERENCES alumno(id) ON DELETE CASCADE,
  tutor_id       INT           NOT NULL REFERENCES tutor(id)  ON DELETE RESTRICT,
  vinculo        vinculo_tutor NOT NULL,
  es_responsable BOOLEAN       NOT NULL DEFAULT FALSE,   -- el campo «Tutor del niño»
  PRIMARY KEY (alumno_id, tutor_id),
  CONSTRAINT uq_alumno_vinculo UNIQUE (alumno_id, vinculo)   -- un solo padre y una sola madre
);
CREATE UNIQUE INDEX uq_un_responsable ON alumno_tutor (alumno_id) WHERE es_responsable;

-- =====================================================================
-- BLOQUE 6 · Inscripción, vivienda y contactos (3 tablas)
-- =====================================================================
CREATE TABLE inscripcion (
  id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alumno_id          INT          NOT NULL REFERENCES alumno(id)  ON DELETE RESTRICT,
  grado_id           SMALLINT     NOT NULL REFERENCES grado(id)   ON DELETE RESTRICT,
  ciclo_lectivo      SMALLINT     NOT NULL,
  repitente          BOOLEAN      NOT NULL,
  escuela_origen     VARCHAR(80),
  cantidad_hermanos  SMALLINT,
  cargada_por_id     INT          NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
  creada_el          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  actualizada_por_id INT                   REFERENCES usuario(id) ON DELETE RESTRICT,
  actualizada_el     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_alumno_ciclo  UNIQUE (alumno_id, ciclo_lectivo),   -- una inscripción por año
  CONSTRAINT chk_ciclo        CHECK (ciclo_lectivo BETWEEN 2000 AND 2100),
  CONSTRAINT chk_hermanos     CHECK (cantidad_hermanos IS NULL OR cantidad_hermanos BETWEEN 0 AND 99),
  CONSTRAINT chk_fechas       CHECK (actualizada_el >= creada_el)
);

-- La escuela recibe de 3 a 14 años, contados al 30 de junio del ciclo
-- (edadEnElCiclo en validarInscripcion.js). Necesita la fecha de nacimiento
-- del alumno, que está en otra tabla: por eso es un trigger y no un CHECK.
CREATE FUNCTION controlar_edad_inscripcion() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  nacimiento DATE;
  edad       INT;
BEGIN
  SELECT fecha_nacimiento INTO nacimiento FROM alumno WHERE id = NEW.alumno_id;
  edad := date_part('year', age(make_date(NEW.ciclo_lectivo, 6, 30), nacimiento));
  IF edad NOT BETWEEN 3 AND 14 THEN
    RAISE EXCEPTION 'El alumno tendría % años en el ciclo %; la escuela recibe de 3 a 14', edad, NEW.ciclo_lectivo;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_edad_inscripcion
  BEFORE INSERT OR UPDATE OF alumno_id, ciclo_lectivo ON inscripcion
  FOR EACH ROW EXECUTE FUNCTION controlar_edad_inscripcion();

CREATE TABLE vivienda (
  inscripcion_id    INT PRIMARY KEY REFERENCES inscripcion(id) ON DELETE CASCADE,   -- 1:1
  personas_en_casa  SMALLINT          NOT NULL,
  tenencia          tenencia_vivienda NOT NULL,
  tipo              tipo_vivienda     NOT NULL,
  distancia_cuadras SMALLINT,
  CONSTRAINT chk_personas  CHECK (personas_en_casa BETWEEN 2 AND 30),
  CONSTRAINT chk_distancia CHECK (distancia_cuadras IS NULL OR distancia_cuadras BETWEEN 0 AND 999)
);

CREATE TABLE contacto_emergencia (
  id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inscripcion_id       INT         NOT NULL REFERENCES inscripcion(id) ON DELETE CASCADE,
  apellido             VARCHAR(60) NOT NULL,
  nombres              VARCHAR(60) NOT NULL,
  parentesco           VARCHAR(30) NOT NULL,
  telefono             VARCHAR(20) NOT NULL,
  telefono_alternativo VARCHAR(20),
  orden                SMALLINT    NOT NULL,   -- 1 obligatorio, 2 opcional
  CONSTRAINT uq_contacto_orden    UNIQUE (inscripcion_id, orden),
  CONSTRAINT chk_contacto_orden   CHECK (orden IN (1, 2)),
  CONSTRAINT chk_contacto_ape     CHECK (length(trim(apellido)) >= 2),
  CONSTRAINT chk_contacto_nom     CHECK (length(trim(nombres))  >= 2),
  CONSTRAINT chk_contacto_tel     CHECK (telefono_valido(telefono)),
  CONSTRAINT chk_contacto_tel2    CHECK (telefono_valido(telefono_alternativo))
);

-- =====================================================================
-- BLOQUE 7 · Índices para el listado, los filtros y las estadísticas
-- =====================================================================
CREATE INDEX idx_alumno_apellido   ON alumno (apellido, nombres);
CREATE INDEX idx_inscripcion_ciclo ON inscripcion (ciclo_lectivo, grado_id);
CREATE INDEX idx_noticia_fecha     ON noticia (publicada, fecha DESC);
CREATE INDEX idx_registro_fecha    ON registro_acceso (fecha DESC);
CREATE INDEX idx_registro_usuario  ON registro_acceso (usuario_id, fecha DESC);

-- =====================================================================
-- BLOQUE 8 · Datos de los catálogos y usuarios de prueba
-- =====================================================================
INSERT INTO rol (codigo, nombre) VALUES
  ('vicedirectora', 'Dirección / Vicedirección'),
  ('secretario',    'Secretaría'),
  ('maestro',       'Maestro/a');

INSERT INTO grado (nombre, orden) VALUES
  ('Jardín',0),('1°',1),('2°',2),('3°',3),('4°',4),('5°',5),('6°',6);

INSERT INTO provincia (id, nombre) VALUES
  (2,'Ciudad Autónoma de Buenos Aires'),(6,'Buenos Aires'),(10,'Catamarca'),
  (14,'Córdoba'),(18,'Corrientes'),(22,'Chaco'),(26,'Chubut'),(30,'Entre Ríos'),
  (34,'Formosa'),(38,'Jujuy'),(42,'La Pampa'),(46,'La Rioja'),(50,'Mendoza'),
  (54,'Misiones'),(58,'Neuquén'),(62,'Río Negro'),(66,'Salta'),(70,'San Juan'),
  (74,'San Luis'),(78,'Santa Cruz'),(82,'Santa Fe'),(86,'Santiago del Estero'),
  (90,'Tucumán'),(94,'Tierra del Fuego, Antártida e Islas del Atlántico Sur');

INSERT INTO categoria_noticia (nombre) VALUES
  ('Comunicados'),('Actividades'),('Novedades');

INSERT INTO tipo_evento (codigo, nombre) VALUES
  ('INGRESO',                 'Ingreso'),
  ('INGRESO_FALLIDO',         'Intento fallido'),
  ('SALIDA',                  'Salida'),
  ('RECUPERACION_SOLICITADA', 'Pidió recuperar la contraseña'),
  ('CONTRASENA_CAMBIADA',     'Cambió la contraseña'),
  ('USUARIO_CREADO',          'Alta de cuenta'),
  ('USUARIO_EDITADO',         'Modificación de cuenta'),
  ('USUARIO_DESACTIVADO',     'Baja de cuenta'),
  ('USUARIO_REACTIVADO',      'Reactivación de cuenta');
-- Usuarios de prueba. Contraseñas: 8+ caracteres con letra y número (validarPassword)
INSERT INTO usuario (id, nombres, apellido, usuario, mail, password_hash, rol_id, grado_id, activo, creado_el)
OVERRIDING SYSTEM VALUE VALUES
  (1, 'Paola', 'Nassif', 'admin', 'vicedireccion@escuelaroca.edu.ar', crypt('admin123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'vicedirectora'), NULL, TRUE, '2024-03-01 08:00:00-03'),
  (2, 'Marcos', 'Díaz', 'secretario', 'secretaria@escuelaroca.edu.ar', crypt('secretario123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'secretario'), NULL, TRUE, '2024-03-01 08:00:00-03'),
  (3, 'Laura', 'Gómez', 'maestra1', 'maestra1@escuelaroca.edu.ar', crypt('maestra123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = '1°'), TRUE, '2024-03-01 08:00:00-03'),
  (4, 'Diego', 'Ruiz', 'maestro2', 'maestro2@escuelaroca.edu.ar', crypt('maestro123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = '2°'), TRUE, '2024-03-01 08:00:00-03'),
  (5, 'Silvia', 'Albornoz', 'salbornoz', 'salbornoz@escuelaroca.edu.ar', crypt('maestra123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = 'Jardín'), TRUE, '2024-03-01 08:00:00-03'),
  (6, 'Carolina', 'Juárez', 'cjuarez', 'cjuarez@escuelaroca.edu.ar', crypt('maestra123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = '3°'), TRUE, '2024-03-01 08:00:00-03'),
  (7, 'Gabriela', 'Ledesma', 'gledesma', 'gledesma@escuelaroca.edu.ar', crypt('maestra123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = '4°'), TRUE, '2024-03-01 08:00:00-03'),
  (8, 'Ramiro', 'Villagra', 'rvillagra', 'rvillagra@escuelaroca.edu.ar', crypt('maestro123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = '5°'), TRUE, '2024-03-01 08:00:00-03'),
  (9, 'Andrea', 'Costilla', 'acostilla', 'acostilla@escuelaroca.edu.ar', crypt('maestra123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = '6°'), TRUE, '2024-03-01 08:00:00-03'),
  (10, 'Hugo', 'Carrizo', 'hcarrizo', 'hcarrizo@escuelaroca.edu.ar', crypt('maestro123', gen_salt('bf', 10)),
     (SELECT id FROM rol WHERE codigo = 'maestro'), (SELECT id FROM grado WHERE nombre = '6°'), FALSE, '2024-03-01 08:00:00-03');
SELECT setval(pg_get_serial_sequence('usuario', 'id'), (SELECT max(id) FROM usuario));


