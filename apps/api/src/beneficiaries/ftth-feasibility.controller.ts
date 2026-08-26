import { BadRequestException, Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { FtthFeasibilityResult } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { FtthFeasibilityService } from './ftth-feasibility.service';
import { isFtthFeasibilityResult } from './ftth-feasibility-state';

@Controller('provider-referrals/:referralId/feasibility')
@UseGuards(PermissionsGuard)
export class FtthFeasibilityController {
  constructor(private readonly authService: AuthService, private readonly service: FtthFeasibilityService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.FEASIBILITY_WRITE)
  async assess(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string,
    @Body() body: {
      result?: string;
      coverageConfirmed?: boolean;
      infrastructureReference?: string;
      availablePorts?: number;
      estimatedDropMeters?: number;
      technicalReason?: string;
      estimatedReadyAt?: string;
    }
  ) {
    if (!body.result || !isFtthFeasibilityResult(body.result)) throw new BadRequestException('Resultado de viabilidade inválido.');
    if (typeof body.coverageConfirmed !== 'boolean') throw new BadRequestException('coverageConfirmed é obrigatório.');
    const estimatedReadyAt = body.estimatedReadyAt ? new Date(body.estimatedReadyAt) : undefined;
    if (estimatedReadyAt && Number.isNaN(estimatedReadyAt.getTime())) throw new BadRequestException('estimatedReadyAt inválido.');
    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.assess(context, referralId, {
      result: body.result as FtthFeasibilityResult,
      coverageConfirmed: body.coverageConfirmed,
      infrastructureReference: body.infrastructureReference,
      availablePorts: body.availablePorts,
      estimatedDropMeters: body.estimatedDropMeters,
      technicalReason: body.technicalReason,
      estimatedReadyAt
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.FEASIBILITY_READ)
  async get(@Headers('authorization') authorization: string | undefined, @Param('referralId') referralId: string) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.getForReferral(context, referralId);
  }
}
