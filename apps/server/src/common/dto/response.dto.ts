export class ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;

  constructor(success: boolean, data?: T, message?: string, error?: string) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
  }

  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  static error(message: string, error?: string): ApiResponse<null> {
    return new ApiResponse(false, null, message, error);
  }
}
