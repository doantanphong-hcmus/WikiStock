import { execFileSync } from 'node:child_process';

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (!testDatabaseUrl) {
  throw new Error('Thiếu TEST_DATABASE_URL của PostgreSQL test riêng.');
}

const configuredDatabaseUrl = process.env.DATABASE_URL?.trim();
if (configuredDatabaseUrl === testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL phải khác DATABASE_URL của dev/demo.');
}

const target = new URL(testDatabaseUrl);
if (!['postgres:', 'postgresql:'].includes(target.protocol)) {
  throw new Error('TEST_DATABASE_URL phải là kết nối PostgreSQL.');
}

const env = { ...process.env, DATABASE_URL: testDatabaseUrl };
const commandOptions = {
  env,
  stdio: 'inherit' as const,
};
const runNpm = (args: string[]) =>
  process.platform === 'win32'
    ? execFileSync(
        process.env.ComSpec ?? 'cmd.exe',
        ['/d', '/s', '/c', `npm.cmd ${args.join(' ')}`],
        commandOptions,
      )
    : execFileSync('npm', args, commandOptions);

// Dùng đúng bootstrap của dự án để kiểm tra migration, seed và pgvector trước E2E.
runNpm(['run', 'db:bootstrap']);
runNpm([
  'exec',
  'jest',
  '--',
  '--config',
  './test/jest-e2e.json',
  '--runInBand',
  'test/real-data.e2e-spec.ts',
]);
