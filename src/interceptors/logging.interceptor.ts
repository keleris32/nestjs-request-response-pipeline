import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RequestService } from '../request.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  // Inject the request service
  constructor(private readonly requestService: RequestService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    this.logger.log(LoggingInterceptor.name);

    const request = context.switchToHttp().getRequest();
    const userAgent = request.get('user-agent') || '';
    const { ip, method, path: url } = request;

    this.logger.log(`
        ${ip} ${method} ${url} ${userAgent}: ${context.getClass().name} ${
      context.getHandler().name
    } invoked!  
    `);

    this.logger.debug('userId:', this.requestService.getUserId());

    const timeAtRequest = Date.now();

    return next.handle().pipe(
      tap((res) => {
        const response = context.switchToHttp().getResponse();

        const { statusCode } = response;
        const contentLength = response.get('content-length');

        this.logger.log(`
                ${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip}: ${
          Date.now() - timeAtRequest
        }ms
            `);

        this.logger.debug('Response:', res);
      }),
    );
  }
}
