import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from './common/dto/response.dto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from './auth/decorators/current-user.decorator';

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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: CurrentUserType): ApiResponse<CurrentUserType> {
    return ApiResponse.success(user);
  }
}
