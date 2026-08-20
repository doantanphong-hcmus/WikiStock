import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { appConfig, validateRuntimeConfig } from './config/app.config';

async function bootstrap() {
  validateRuntimeConfig();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApp(app);
  await app.listen(appConfig.port);
}
void bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error && error.message.startsWith('Cấu hình Backend')
      ? error.message
      : 'Backend không thể khởi động';
  Logger.error(message, undefined, 'Bootstrap');
  process.exitCode = 1;
});
