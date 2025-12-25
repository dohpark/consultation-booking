import { Injectable } from '@nestjs/common';
import { ConsultationNotesRepository } from './consultation-notes.repository';

@Injectable()
export class ConsultationNotesService {
  constructor(private readonly consultationNotesRepository: ConsultationNotesRepository) {}
}
