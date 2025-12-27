import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // SMTP 설정
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');

    // SMTP 인증 정보 확인
    if (!smtpUser || !smtpPassword) {
      console.warn('⚠️  SMTP_USER 또는 SMTP_PASSWORD가 설정되지 않았습니다. 이메일 전송이 실패할 수 있습니다.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth:
        smtpUser && smtpPassword
          ? {
              user: smtpUser,
              pass: smtpPassword,
            }
          : undefined,
    });
  }

  /**
   * 초대 링크 이메일 전송
   */
  async sendInvitationEmail(to: string, link: string, counselorName?: string): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@example.com';

    const subject = '상담 예약 초대 링크';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h1 style="color: #18b4ad; margin-top: 0;">상담 예약 초대</h1>
            <p>안녕하세요${counselorName ? `, ${counselorName} 상담사` : ''}입니다.</p>
            <p>아래 링크를 클릭하여 상담 예약을 진행해주세요.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="display: inline-block; background-color: #18b4ad; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">예약하기</a>
            </div>
            <p style="font-size: 14px; color: #666;">또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #f1f1f1; padding: 10px; border-radius: 4px;">${link}</p>
            <p style="font-size: 12px; color: #999; margin-top: 30px;">이 이메일은 자동으로 발송된 메일입니다. 회신하지 마세요.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
상담 예약 초대

안녕하세요${counselorName ? `, ${counselorName} 상담사` : ''}입니다.

아래 링크를 클릭하여 상담 예약을 진행해주세요.

${link}

이 이메일은 자동으로 발송된 메일입니다. 회신하지 마세요.
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('이메일 전송 실패:', error);

      // Gmail 인증 오류인 경우 더 명확한 메시지 제공
      if (error instanceof Error && error.message.includes('Authentication Required')) {
        throw new InternalServerErrorException(
          'Gmail 인증에 실패했습니다. 다음을 확인해주세요:\n' +
            '1. SMTP_USER와 SMTP_PASSWORD가 올바르게 설정되었는지 확인\n' +
            '2. Gmail의 경우 앱 비밀번호를 사용해야 합니다 (일반 비밀번호 사용 불가)\n' +
            '3. Google 계정 > 보안 > 2단계 인증 > 앱 비밀번호에서 앱 비밀번호 생성',
        );
      }

      throw new InternalServerErrorException(
        `이메일 전송에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}. SMTP 설정을 확인해주세요.`,
      );
    }
  }
}
