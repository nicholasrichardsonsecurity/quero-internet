import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './permissions.guard';
import { LoginThrottleService } from './login-throttle.service';
import { AuthAuditService } from './auth-audit.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PermissionsGuard, LoginThrottleService, AuthAuditService],
  exports: [AuthService, PermissionsGuard]
})
export class AuthModule {}
