import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SlotsModule } from './slots/slots.module';
import { ReservationsModule } from './reservations/reservations.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ConsultationNotesModule } from './consultation-notes/consultation-notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // NODE_ENV에 따라 .env.development 또는 .env.production 로드
      // 없으면 .env 파일을 fallback으로 사용
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    PrismaModule,
    AuthModule,
    SlotsModule,
    ReservationsModule,
    InvitationsModule,
    ConsultationNotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
