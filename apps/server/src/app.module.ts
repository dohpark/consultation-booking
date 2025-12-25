import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SlotsModule } from './slots/slots.module';
import { ReservationsModule } from './reservations/reservations.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ConsultationNotesModule } from './consultation-notes/consultation-notes.module';

@Module({
  imports: [AuthModule, SlotsModule, ReservationsModule, InvitationsModule, ConsultationNotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
