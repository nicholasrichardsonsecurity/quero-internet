import {
  assertTenantOwnership,
  TenantBoundaryViolationError,
  tenantWhere
} from './tenant-scope';

describe('tenant scope', () => {
  it('always injects the active tenant into database filters', () => {
    expect(tenantWhere('tenant-a', { status: 'ACTIVE' })).toEqual({
      status: 'ACTIVE',
      tenantId: 'tenant-a'
    });
  });

  it('rejects an entity owned by another tenant', () => {
    expect(() =>
      assertTenantOwnership({ tenantId: 'tenant-b' }, 'tenant-a')
    ).toThrow(TenantBoundaryViolationError);
  });

  it('accepts an entity owned by the active tenant', () => {
    expect(() =>
      assertTenantOwnership({ tenantId: 'tenant-a' }, 'tenant-a')
    ).not.toThrow();
  });

  it('fails closed when tenant context is missing', () => {
    expect(() => tenantWhere('')).toThrow(TenantBoundaryViolationError);
  });
});
