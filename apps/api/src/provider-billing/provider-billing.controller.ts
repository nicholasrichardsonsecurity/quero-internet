import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ProviderBillingService } from './provider-billing.service';

type MeasurementBody = {
  tenantId?: string;
  municipalityOrganizationId?: string;
  providerOrganizationId?: string;
  programId?: string;
  competenceStart?: string;
  competenceEnd?: string;
  beneficiaryCount?: number;
  activeServiceCount?: number;
  totalAmount?: number | string;
};

type InvoiceBody = {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  amount?: number | string;
  documentUrl?: string;
  paymentUrl?: string;
  externalReference?: string;
};

@Controller('provider-billing')
@UseGuards(PermissionsGuard)
export class ProviderBillingController {
  constructor(
    private readonly authService: AuthService,
    private readonly service: ProviderBillingService
  ) {}

  @Post('measurements')
  @RequirePermissions(PERMISSIONS.PROVIDER_WRITE)
  createMeasurement(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: MeasurementBody
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.createMeasurement(context, body));
  }

  @Get('measurements')
  @RequirePermissions(PERMISSIONS.PROVIDER_READ)
  listMeasurements(@Headers('authorization') authorization: string | undefined) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.listMeasurements(context));
  }

  @Post('measurements/:measurementId/submit')
  @RequirePermissions(PERMISSIONS.PROVIDER_WRITE)
  submitMeasurement(
    @Headers('authorization') authorization: string | undefined,
    @Param('measurementId') measurementId: string
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.submitMeasurement(context, measurementId));
  }

  @Post('measurements/:measurementId/approve')
  @RequirePermissions(PERMISSIONS.MUNICIPALITY_WRITE)
  approveMeasurement(
    @Headers('authorization') authorization: string | undefined,
    @Param('measurementId') measurementId: string
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.approveMeasurement(context, measurementId));
  }

  @Post('measurements/:measurementId/invoice')
  @RequirePermissions(PERMISSIONS.PROVIDER_WRITE)
  registerInvoice(
    @Headers('authorization') authorization: string | undefined,
    @Param('measurementId') measurementId: string,
    @Body() body: InvoiceBody
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.registerInvoice(context, measurementId, body));
  }

  @Get('measurements/:measurementId/invoice')
  @RequirePermissions(PERMISSIONS.PROVIDER_READ)
  getInvoice(
    @Headers('authorization') authorization: string | undefined,
    @Param('measurementId') measurementId: string
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.getInvoice(context, measurementId));
  }
}
