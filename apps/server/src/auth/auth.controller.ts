import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'accessToken'>> {
    const result = await this.authService.googleLogin(dto);

    // JWT를 HTTP-only 쿠키로 설정
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // accessToken은 응답에서 제외 (쿠키로만 전송)
    return {
      user: result.user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // HTTP-only 쿠키 삭제
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { success: true, message: '로그아웃되었습니다.' };
  }
}
