import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const queryRaw = jest.fn();
  const service = new HealthService({
    $queryRaw: queryRaw,
  } as unknown as PrismaService);

  beforeEach(() => queryRaw.mockReset());

  it('báo ready khi PostgreSQL phản hồi', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.getHealth()).resolves.toMatchObject({
      statusCode: 200,
      data: {
        status: 'ready',
        components: { process: 'available', database: 'available' },
      },
    });
  });

  it('báo không sẵn sàng khi PostgreSQL lỗi', async () => {
    queryRaw.mockRejectedValue(new Error('connection secret must not escape'));

    await expect(service.getHealth()).rejects.toMatchObject({
      response: {
        statusCode: 503,
        error: { code: 'DATABASE_UNAVAILABLE' },
      },
    });
    await expect(service.getHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
