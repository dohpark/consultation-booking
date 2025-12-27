import { Module } from '@nestjs/common';
import { AdminInvitationsController } from './admin-invitations.controller';
import { PublicInvitationsController } from './public-invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [AdminInvitationsController, PublicInvitationsController],
  providers: [InvitationsService, InvitationsRepository],
  exports: [InvitationsService],
})
export class InvitationsModule {}
