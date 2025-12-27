import { Module } from '@nestjs/common';
import { ConsultationNotesController } from './consultation-notes.controller';
import { ConsultationNotesService } from './consultation-notes.service';
import { ConsultationNotesRepository } from './consultation-notes.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [PrismaModule, ReservationsModule],
  controllers: [ConsultationNotesController],
  providers: [ConsultationNotesService, ConsultationNotesRepository],
  exports: [ConsultationNotesService],
})
export class ConsultationNotesModule {}
