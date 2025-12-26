import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { PublicReservationsController } from './public-reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsRepository } from './reservations.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [PrismaModule, InvitationsModule],
  controllers: [ReservationsController, PublicReservationsController],
  providers: [ReservationsService, ReservationsRepository],
  exports: [ReservationsService],
})
export class ReservationsModule {}
