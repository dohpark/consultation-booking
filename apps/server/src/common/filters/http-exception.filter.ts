import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../dto/response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorMessage: string;
    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
      const responseObj = exceptionResponse as { message?: string | string[] };
      if (Array.isArray(responseObj.message)) {
        errorMessage = responseObj.message.join(', ');
      } else if (typeof responseObj.message === 'string') {
        errorMessage = responseObj.message;
      } else {
        errorMessage = exception.message;
      }
    } else {
      errorMessage = exception.message;
    }

    const apiResponse = ApiResponse.error(
      errorMessage,
      status === (HttpStatus.INTERNAL_SERVER_ERROR as number) ? 'Internal Server Error' : undefined,
    );

    response.status(status).json(apiResponse);
  }
}
