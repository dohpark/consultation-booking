import { Controller, UseGuards } from '@nestjs/common';
import { ConsultationNotesService } from './consultation-notes.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';

@Controller('consultation-notes')
@UseGuards(AdminRoleGuard)
export class ConsultationNotesController {
  constructor(private readonly consultationNotesService: ConsultationNotesService) {}
}
