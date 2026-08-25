import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class BasicGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Placeholder: implement real auth/role checks in infra layer.
    return true;
  }
}
