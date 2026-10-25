import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './permissions.guard';
import { LoginThrottleService } from './login-throttle.service';
import { AuthAuditService } from './auth-audit.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PermissionsGuard,
    LoginThrottleService,
    AuthAuditService,
    { provide: APP_GUARD, useExisting: PermissionsGuard }
  ],
  exports: [AuthService, PermissionsGuard]
})
export class AuthModule {}
