import { Module } from '@nestjs/common';
import { AdminSlotsController } from './admin-slots.controller';
import { PublicSlotsController } from './public-slots.controller';
import { SlotsService } from './slots.service';
import { SlotsRepository } from './slots.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [PrismaModule, InvitationsModule, ReservationsModule],
  controllers: [AdminSlotsController, PublicSlotsController],
  providers: [SlotsService, SlotsRepository],
  exports: [SlotsService],
})
export class SlotsModule {}
