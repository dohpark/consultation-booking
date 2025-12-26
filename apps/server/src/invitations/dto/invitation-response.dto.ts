export class InvitationResponseDto {
  token: string;
  link: string;
  email: string;
  expiresAt: Date;
  counselorId: string;
}
