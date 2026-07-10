import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../common/types/api.types';

@Injectable()
export class HealthService {
  getHealth(): ApiResponse<{ status: string }> {
    return {
      statusCode: 200,
      message: 'Service healthy',
      data: { status: 'ok' },
      error: null,
    };
  }
}
