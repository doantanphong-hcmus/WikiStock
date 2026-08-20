export const appConfig = {
  get port() {
    return Number(process.env.PORT ?? 3001);
  },
  get frontendUrl() {
    return process.env.FRONTEND_URL ?? 'http://localhost:3000';
  },
  get jwtSecret() {
    return process.env.JWT_SECRET;
  },
  get jwtExpiresInSeconds() {
    return Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600);
  },
};

function isPositiveInteger(value: string | undefined): boolean {
  return Boolean(value && /^\d+$/.test(value) && Number(value) > 0);
}

function isUrl(value: string | undefined, protocols: string[]): boolean {
  if (!value) return false;
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function validateRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const errors: string[] = [];
  const databaseUrl = env.DATABASE_URL?.trim();

  if (databaseUrl) {
    if (!isUrl(databaseUrl, ['postgres:', 'postgresql:'])) {
      errors.push('DATABASE_URL phải là URL PostgreSQL hợp lệ');
    }
  } else {
    const missing = [
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
    ].filter((name) => !env[name]?.trim());
    if (missing.length) {
      errors.push(
        `Thiếu DATABASE_URL hoặc bộ biến DB_*: ${missing.join(', ')}`,
      );
    } else if (!isPositiveInteger(env.DB_PORT)) {
      errors.push('DB_PORT phải là số nguyên dương');
    }
  }

  if (env.NODE_ENV !== 'test') {
    const secret = env.JWT_SECRET?.trim();
    if (!secret || secret.length < 32 || secret.includes('replace_with')) {
      errors.push(
        'JWT_SECRET phải có ít nhất 32 ký tự và không dùng giá trị mẫu',
      );
    }
  }
  if (!isUrl(env.AI_SERVICE_URL?.trim(), ['http:', 'https:'])) {
    errors.push('AI_SERVICE_URL phải là URL HTTP(S) hợp lệ');
  }
  if (!isPositiveInteger(env.AI_SERVICE_TIMEOUT_MS)) {
    errors.push('AI_SERVICE_TIMEOUT_MS phải là số nguyên dương');
  }
  if (!isUrl(env.FRONTEND_URL?.trim(), ['http:', 'https:'])) {
    errors.push('FRONTEND_URL phải là URL HTTP(S) hợp lệ');
  }
  if (!env.SEED_DATA_PATH?.trim() || env.SEED_DATA_PATH.includes('\0')) {
    errors.push('SEED_DATA_PATH không được để trống');
  }
  if (env.PORT !== undefined && !isPositiveInteger(env.PORT)) {
    errors.push('PORT phải là số nguyên dương');
  }
  if (
    env.JWT_EXPIRES_IN_SECONDS !== undefined &&
    !isPositiveInteger(env.JWT_EXPIRES_IN_SECONDS)
  ) {
    errors.push('JWT_EXPIRES_IN_SECONDS phải là số nguyên dương');
  }

  if (errors.length) {
    throw new Error(`Cấu hình Backend không hợp lệ:\n- ${errors.join('\n- ')}`);
  }
}
