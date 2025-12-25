import { Injectable } from '@nestjs/common';
import { InvitationsRepository } from './invitations.repository';

@Injectable()
export class InvitationsService {
  constructor(private readonly invitationsRepository: InvitationsRepository) {}
}
