import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

function createHost() {
  let responseBody: unknown;
  const json = jest.fn((body: unknown) => {
    responseBody = body;
  });
  const response = {
    status: jest.fn().mockReturnThis(),
    json,
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'POST', path: '/api/test' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response, getResponseBody: () => responseBody };
}

describe('ApiExceptionFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('chuẩn hóa lỗi validation', () => {
    const { host, response } = createHost();
    new ApiExceptionFilter().catch(
      new BadRequestException({ message: ['query must not be empty'] }),
      host,
    );

    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Request validation failed',
      data: null,
      error: { code: 'BAD_REQUEST', details: 'query must not be empty' },
    });
  });

  it('không trả message hoặc stack của lỗi nội bộ', () => {
    const { host, getResponseBody } = createHost();
    new ApiExceptionFilter().catch(
      new Error('DATABASE_URL=postgresql://user:secret@database/app'),
      host,
    );

    const body = getResponseBody();
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(body).toMatchObject({
      statusCode: 500,
      error: { code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});
