import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from './common/dto/response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): ApiResponse<{ status: string; timestamp: string }> {
    return ApiResponse.success({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}
