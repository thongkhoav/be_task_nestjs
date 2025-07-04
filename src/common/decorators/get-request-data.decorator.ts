import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadWithRt, JwtUserWithRt } from '../../auth/types';

// This decorator extracts the current user from the request object.
// Use after applying the JwtStrategy to your route handlers.
export const GetRequestData = createParamDecorator(
  (data: keyof JwtUserWithRt | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if (!data) return request.user;
    return request.user[data];
  },
);
