import { Injectable } from '@nestjs/common';
import type { ApiResponse } from './common/types/api.types';

@Injectable()
export class AppService {
  getHello(): ApiResponse<{ name: string; status: string }> {
    return {
      statusCode: 200,
      message: 'WikiStock API gateway',
      data: {
        name: 'WikiStock Backend',
        status: 'ok',
      },
      error: null,
    };
  }
}
