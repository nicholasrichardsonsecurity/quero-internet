import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { MunicipalBillingService } from './municipal-billing.service';

type ContractBody = {
  tenantId?: string;
  municipalityOrganizationId?: string;
  programId?: string;
  contractNumber?: string;
  title?: string;
  startsAt?: string;
  endsAt?: string;
  monthlySaaSValue?: number | string;
  billingCustomerId?: string;
};

type PeriodBody = {
  competenceStart?: string;
  competenceEnd?: string;
  dueDate?: string;
  amount?: number | string;
};

@Controller('municipal-billing')
@UseGuards(PermissionsGuard)
export class MunicipalBillingController {
  constructor(
    private readonly authService: AuthService,
    private readonly service: MunicipalBillingService
  ) {}

  @Post('contracts')
  @RequirePermissions(PERMISSIONS.MUNICIPALITY_WRITE)
  createContract(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: ContractBody
  ) {
    return this.service.createContract(
      this.authService.resolveAuthorization(authorization),
      body
    );
  }

  @Get('contracts')
  @RequirePermissions(PERMISSIONS.MUNICIPALITY_READ)
  listContracts(
    @Headers('authorization') authorization: string | undefined,
    @Query('tenantId') tenantId?: string
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.listContracts(context, tenantId));
  }

  @Get('contracts/:contractId')
  @RequirePermissions(PERMISSIONS.MUNICIPALITY_READ)
  getContract(
    @Headers('authorization') authorization: string | undefined,
    @Param('contractId') contractId: string
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.getContract(context, contractId));
  }

  @Post('contracts/:contractId/periods')
  @RequirePermissions(PERMISSIONS.MUNICIPALITY_WRITE)
  createPeriod(
    @Headers('authorization') authorization: string | undefined,
    @Param('contractId') contractId: string,
    @Body() body: PeriodBody
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.createPeriod(context, contractId, body));
  }

  @Get('contracts/:contractId/periods')
  @RequirePermissions(PERMISSIONS.MUNICIPALITY_READ)
  listPeriods(
    @Headers('authorization') authorization: string | undefined,
    @Param('contractId') contractId: string
  ) {
    return this.authService.resolveAuthorization(authorization)
      .then((context) => this.service.listPeriods(context, contractId));
  }
}
