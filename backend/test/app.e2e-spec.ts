import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/app.setup';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 200,
          message: 'WikiStock API gateway',
          data: { name: 'WikiStock Backend', status: 'ok' },
          error: null,
        });
      });
  });

  it('chuẩn hóa lỗi xác thực của Admin', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/companies')
      .expect(401);

    expect(response.body).toEqual({
      statusCode: 401,
      message: 'Bearer token is required',
      data: null,
      error: { code: 'UNAUTHORIZED', details: 'Bearer token is required' },
    });
  });

  it('chuẩn hóa lỗi DTO và giới hạn request body', async () => {
    const invalid = await request(app.getHttpServer())
      .post('/api/v1/ai/ask')
      .send({})
      .expect(400);
    expect(invalid.body).toMatchObject({
      statusCode: 400,
      error: { code: 'BAD_REQUEST' },
    });

    const tooLarge = await request(app.getHttpServer())
      .post('/api/v1/ai/ask')
      .send({ query: 'x'.repeat(33 * 1024), companyCode: 'FPT' })
      .expect(413);
    expect(tooLarge.body).toMatchObject({
      statusCode: 413,
      error: { code: 'PAYLOAD_TOO_LARGE' },
    });
  });

  it('chỉ phản hồi CORS cho Frontend đã cấu hình', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/api')
      .set('Origin', 'http://localhost:3000')
      .expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );

    const other = await request(app.getHttpServer())
      .get('/api')
      .set('Origin', 'https://untrusted.example.com')
      .expect(200);
    expect(other.headers['access-control-allow-origin']).not.toBe(
      'https://untrusted.example.com',
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
