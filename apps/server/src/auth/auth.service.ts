import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }
    this.googleClient = new OAuth2Client({ clientId });
  }

  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponseDto> {
    try {
      // Google id_token 검증
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (!clientId) {
        throw new UnauthorizedException('Google client ID not configured');
      }
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, name, sub } = payload;

      if (!email || !name || !sub) {
        throw new UnauthorizedException('Missing user information from Google');
      }

      // JWT 토큰 발급
      const jwtPayload: JwtPayload = {
        sub,
        email,
        name,
      };

      const accessToken = this.jwtService.sign(jwtPayload);

      return {
        accessToken,
        user: {
          email,
          name,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Google authentication failed');
    }
  }
}
