import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { json, NextFunction, Request, Response, urlencoded } from 'express';
import { appConfig } from './config/app.config';

const requestLogger = new Logger('HTTP');

export function configureApp(app: INestApplication): void {
  if (process.env.NODE_ENV !== 'test') {
    app.use((request: Request, response: Response, next: NextFunction) => {
      const startedAt = performance.now();
      response.once('finish', () => {
        requestLogger.log(
          `${request.method} ${request.path} ${response.statusCode} ${Math.round(performance.now() - startedAt)}ms`,
        );
      });
      next();
    });
  }

  app.use(
    json({ limit: '32kb' }),
    urlencoded({ extended: true, limit: '32kb' }),
  );
  app.enableCors({ origin: appConfig.frontendUrl, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
    }),
  );
}
