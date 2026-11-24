import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Valida el body de cada pedido con los decoradores de los DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta los campos que el DTO no declara
      forbidNonWhitelisted: true, // y responde 400 si llega alguno
      stopAtFirstError: true, // un solo mensaje por campo: el primero que falla
      transform: true, // aplica @Recortar y le pasa al controller la clase del DTO
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
