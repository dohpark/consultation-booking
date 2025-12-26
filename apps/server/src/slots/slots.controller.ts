import { Controller, UseGuards } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';

@Controller('slots')
@UseGuards(AdminRoleGuard)
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}
}
