import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        // 이미 ApiResponse 형식이면 그대로 반환
        if (data instanceof ApiResponse) {
          return data as ApiResponse<T>;
        }
        // 그 외의 경우 success로 래핑
        return ApiResponse.success(data as T);
      }),
    );
  }
}
