import { Controller } from '@nestjs/common';
import { ConsultationNotesService } from './consultation-notes.service';

@Controller('consultation-notes')
export class ConsultationNotesController {
  constructor(private readonly consultationNotesService: ConsultationNotesService) {}
}
