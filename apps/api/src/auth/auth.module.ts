import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './permissions.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PermissionsGuard],
  exports: [AuthService, PermissionsGuard]
})
export class AuthModule {}
