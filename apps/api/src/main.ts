import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { loadEnvironment } from './config/environment';
import { AppModule } from './app.module';

async function bootstrap() {
  const env = loadEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  await app.listen(env.API_PORT, env.API_HOST);
}

void bootstrap();
