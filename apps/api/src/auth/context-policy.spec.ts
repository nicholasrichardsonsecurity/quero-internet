import { resolveOrganizationContext } from './context-policy';

const now = new Date('2026-08-25T12:00:00.000Z');

describe('resolveOrganizationContext', () => {
  it('returns null when session has no organization context', () => {
    expect(resolveOrganizationContext(null, [], now)).toBeNull();
  });

  it('rejects memberships from another organization', () => {
    const result = resolveOrganizationContext(
      'org-a',
      [{
        organizationId: 'org-b',
        role: 'MUNICIPAL_MANAGER',
        status: 'ACTIVE',
        validFrom: null,
        validUntil: null,
        tenantIds: ['tenant-b']
      }],
      now
    );

    expect(result).toBeNull();
  });

  it('rejects suspended and expired memberships', () => {
    const result = resolveOrganizationContext(
      'org-a',
      [
        {
          organizationId: 'org-a',
          role: 'MUNICIPAL_MANAGER',
          status: 'SUSPENDED',
          validFrom: null,
          validUntil: null,
          tenantIds: ['tenant-a']
        },
        {
          organizationId: 'org-a',
          role: 'MUNICIPAL_OPERATOR',
          status: 'ACTIVE',
          validFrom: null,
          validUntil: new Date('2026-08-24T12:00:00.000Z'),
          tenantIds: ['tenant-a']
        }
      ],
      now
    );

    expect(result).toBeNull();
  });

  it('derives tenants and roles only from active memberships in the selected organization', () => {
    const result = resolveOrganizationContext(
      'org-a',
      [
        {
          organizationId: 'org-a',
          role: 'MUNICIPAL_MANAGER',
          status: 'ACTIVE',
          validFrom: null,
          validUntil: null,
          tenantIds: ['tenant-a']
        },
        {
          organizationId: 'org-a',
          role: 'MUNICIPAL_OPERATOR',
          status: 'ACTIVE',
          validFrom: null,
          validUntil: null,
          tenantIds: ['tenant-a']
        },
        {
          organizationId: 'org-b',
          role: 'PROVIDER_MANAGER',
          status: 'ACTIVE',
          validFrom: null,
          validUntil: null,
          tenantIds: ['tenant-b']
        }
      ],
      now
    );

    expect(result).toEqual({
      organizationId: 'org-a',
      tenantIds: ['tenant-a'],
      roles: ['MUNICIPAL_MANAGER', 'MUNICIPAL_OPERATOR']
    });
  });
});
