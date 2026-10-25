import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly authService: AuthService,
    private readonly documentsService: DocumentsService
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.DOCUMENT_WRITE)
  async register(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: {
      tenantId?: string;
      entityType?: string;
      entityId?: string;
      purpose?: string;
      classification?: string;
      originalFileName?: string;
      mimeType?: string;
      byteSize?: number;
      sha256?: string;
      storageKey?: string;
      retentionUntil?: string;
    }
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.documentsService.register(context, body);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.DOCUMENT_READ)
  async list(
    @Headers('authorization') authorization: string | undefined,
    @Query('tenantId') tenantId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.documentsService.list(context, { tenantId, entityType, entityId });
  }
}
