import { validateRuntimeConfig } from './app.config';

const validEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://app_user:app_password@postgres:5432/app_db',
  JWT_SECRET: 'a-secure-runtime-secret-with-32-characters',
  AI_SERVICE_URL: 'http://ai-service:8000',
  AI_SERVICE_TIMEOUT_MS: '60000',
  FRONTEND_URL: 'https://wikistock.example.com',
  SEED_DATA_PATH: '/data/seed_data',
};

describe('validateRuntimeConfig', () => {
  it('chấp nhận cấu hình runtime đầy đủ', () => {
    expect(() => validateRuntimeConfig(validEnv)).not.toThrow();
  });

  it.each([
    ['database', { DATABASE_URL: undefined }],
    ['JWT secret', { JWT_SECRET: 'replace_with_secret' }],
    ['AI URL', { AI_SERVICE_URL: 'not-a-url' }],
    ['AI timeout', { AI_SERVICE_TIMEOUT_MS: '0' }],
    ['Frontend URL', { FRONTEND_URL: 'ftp://example.com' }],
    ['seed path', { SEED_DATA_PATH: '' }],
  ])('từ chối cấu hình %s không hợp lệ', (_name, override) => {
    expect(() => validateRuntimeConfig({ ...validEnv, ...override })).toThrow(
      'Cấu hình Backend không hợp lệ',
    );
  });

  it('cho phép test không khai báo JWT secret', () => {
    expect(() =>
      validateRuntimeConfig({
        ...validEnv,
        NODE_ENV: 'test',
        JWT_SECRET: undefined,
      }),
    ).not.toThrow();
  });
});
