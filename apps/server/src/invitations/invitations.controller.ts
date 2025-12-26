import { Controller, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';

@Controller('invitations')
@UseGuards(AdminRoleGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}
}
