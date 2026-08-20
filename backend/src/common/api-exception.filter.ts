import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type JsonObject = Record<string, unknown>;

const statusCodes: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
};

function asObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function statusOf(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();
  const status = asObject(exception)?.status;
  return Number.isInteger(status) &&
    Number(status) >= 400 &&
    Number(status) < 600
    ? Number(status)
    : HttpStatus.INTERNAL_SERVER_ERROR;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const statusCode = statusOf(exception);
    const raw =
      exception instanceof HttpException ? exception.getResponse() : null;
    const payload = asObject(raw);
    const canonicalError = asObject(payload?.error);
    const messages = Array.isArray(payload?.message)
      ? payload.message.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
    const code =
      typeof canonicalError?.code === 'string'
        ? canonicalError.code
        : (statusCodes[statusCode] ?? 'INTERNAL_SERVER_ERROR');
    const isInternalError =
      statusCode >= 500 && !(exception instanceof HttpException);
    const message = isInternalError
      ? 'Internal server error'
      : typeof payload?.message === 'string'
        ? payload.message
        : messages.length
          ? 'Request validation failed'
          : exception instanceof HttpException
            ? exception.message
            : 'Request failed';
    const details = isInternalError
      ? 'Unexpected server error'
      : typeof canonicalError?.details === 'string'
        ? canonicalError.details
        : messages.join('; ') || message;

    const logLine = `${request.method} ${request.path} ${statusCode} ${code}`;
    if (statusCode >= 500) this.logger.error(logLine);
    else this.logger.warn(logLine);

    response.status(statusCode).json({
      statusCode,
      message,
      data: payload && 'data' in payload ? payload.data : null,
      error: { code, details },
    });
  }
}
