import { useMutation } from '@tanstack/react-query';
import { createInvitation } from '../services/invitationsService';
import type { CreateInvitationDto, InvitationResponse } from '../types';

export const INVITATIONS_QUERY_KEYS = {
  all: ['invitations'] as const,
  create: () => [...INVITATIONS_QUERY_KEYS.all, 'create'] as const,
} as const;

export function useCreateInvitation() {
  return useMutation<InvitationResponse, Error, CreateInvitationDto>({
    mutationKey: INVITATIONS_QUERY_KEYS.create(),
    mutationFn: createInvitation,
  });
}
