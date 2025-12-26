import { Controller, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';

@Controller('reservations')
@UseGuards(AdminRoleGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}
}
