export class AuthResponseDto {
  accessToken: string;
  user: {
    email: string;
    name: string;
    userId: string;
  };
}
