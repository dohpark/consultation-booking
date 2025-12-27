export interface CreateInvitationDto {
  email: string;
  expiresInDays?: number;
}

export interface InvitationResponse {
  token: string;
  link: string;
  email: string;
  expiresAt: string;
  counselorId: string;
}

