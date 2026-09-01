import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { loadEnvironment } from './config/environment';
import { ApiExceptionFilter } from './contracts/api-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const env = loadEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(env.API_PORT, env.API_HOST);
}

void bootstrap();
