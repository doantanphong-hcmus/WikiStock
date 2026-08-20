import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { AuthUser, LoginResponse } from '../src/auth/auth.service';
import type { ApiResponse } from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

describeWithDatabase('Customer authentication (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let email: string;
  let accessToken: string;
  const password = 'WikiStock123';
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = 'd1-test-secret-with-at-least-32-characters';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    email = `d1-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    if (prisma && email) {
      await prisma.appUser.deleteMany({ where: { email } });
    }
    await app?.close();

    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  });

  it('đăng ký tạo người dùng thật, băm mật khẩu và không nhận quyền từ request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: '  Người dùng D1  ',
        email: email.toUpperCase(),
        password,
        roleId: 1,
      })
      .expect(201);
    const body = response.body as ApiResponse<AuthUser>;

    expect(body.data).toMatchObject({
      email,
      fullName: 'Người dùng D1',
      role: { roleName: 'user' },
    });
    expect(body.data).not.toHaveProperty('passwordHash');

    const storedUser = await prisma.appUser.findUniqueOrThrow({
      where: { email },
      include: { role: true },
    });
    expect(storedUser.passwordHash).not.toBe(password);
    await expect(compare(password, storedUser.passwordHash)).resolves.toBe(
      true,
    );
    expect(storedUser.role.roleName).toBe('user');
  });

  it('từ chối email trùng và mật khẩu sai', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ fullName: 'Người dùng khác', email, password })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass123' })
      .expect(401);
  });

  it('đăng nhập đúng cấp JWT và /auth/me trả danh tính hiện tại', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: email.toUpperCase(), password })
      .expect(200);
    const loginBody = loginResponse.body as ApiResponse<LoginResponse>;

    accessToken = loginBody.data?.accessToken ?? '';
    expect(accessToken).toEqual(expect.any(String));

    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const meBody = meResponse.body as ApiResponse<AuthUser>;
    expect(meBody.data).toMatchObject({
      email,
      role: { roleName: 'user' },
    });
  });

  it('không cho người dùng thường truy cập API quản trị', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
