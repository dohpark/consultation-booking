import { Module } from '@nestjs/common';
import { ConsultationNotesController } from './consultation-notes.controller';
import { ConsultationNotesService } from './consultation-notes.service';
import { ConsultationNotesRepository } from './consultation-notes.repository';

@Module({
  controllers: [ConsultationNotesController],
  providers: [ConsultationNotesService, ConsultationNotesRepository],
  exports: [ConsultationNotesService],
})
export class ConsultationNotesModule {}
