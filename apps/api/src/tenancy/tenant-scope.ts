export class TenantBoundaryViolationError extends Error {
  constructor() {
    super('Tenant boundary violation');
    this.name = 'TenantBoundaryViolationError';
  }
}

export type TenantOwned = {
  tenantId: string;
};

export function tenantWhere<T extends Record<string, unknown>>(
  tenantId: string,
  where: T = {} as T
): T & { tenantId: string } {
  if (!tenantId) {
    throw new TenantBoundaryViolationError();
  }

  return {
    ...where,
    tenantId
  };
}

export function assertTenantOwnership(entity: TenantOwned, tenantId: string): void {
  if (!tenantId || entity.tenantId !== tenantId) {
    throw new TenantBoundaryViolationError();
  }
}
