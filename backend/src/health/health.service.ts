import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ApiResponse } from '../common/types/api.types';
import { PrismaService } from '../database/prisma.service';

export interface HealthStatus {
  status: 'ready' | 'not_ready';
  components: {
    process: 'available';
    database: 'available' | 'unavailable';
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        statusCode: 200,
        message: 'Backend is ready',
        data: {
          status: 'ready',
          components: { process: 'available', database: 'available' },
        },
        error: null,
      };
    } catch {
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Backend is not ready',
        data: {
          status: 'not_ready',
          components: { process: 'available', database: 'unavailable' },
        },
        error: {
          code: 'DATABASE_UNAVAILABLE',
          details: 'PostgreSQL readiness check failed',
        },
      });
    }
  }
}
