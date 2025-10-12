import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Gym App API')
    .setDescription('API dokumentacija za Gym App - workout tracking aplikaciju')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autentifikacija i registracija korisnika')
    .addTag('Users', 'Upravljanje korisnicima')
    .addTag('Exercises', 'Baza vežbi')
    .addTag('Workout Templates', 'Šabloni treninga koje korisnici prave unapred')
    .addTag('Workout Sessions', 'Aktivni treninzi (clockIn/clockOut)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 5001;
  await app.listen(port);
  
  console.log(`🚀 Aplikacija radi na: http://localhost:${port}`);
  console.log(`📚 Swagger dokumentacija: http://localhost:${port}/api`);
}

bootstrap();