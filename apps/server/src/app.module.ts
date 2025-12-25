import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SlotsModule } from './slots/slots.module';
import { ReservationsModule } from './reservations/reservations.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ConsultationNotesModule } from './consultation-notes/consultation-notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
