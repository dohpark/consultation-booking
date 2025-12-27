export interface ValidateTokenResponse {
  email: string;
  counselorId: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

