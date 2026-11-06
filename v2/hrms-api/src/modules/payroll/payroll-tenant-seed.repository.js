const UPSERT_ORGANIZATION_TENANT = `
  INSERT INTO payroll_tenants (
    organization_id, legal_name, trade_name, country_code, state_code,
    timezone, currency_code, is_active, metadata, created_by, updated_by
  )
  VALUES ($1, $2, $3, 'IN', 'TS', $4, $5, true, '{}'::jsonb, 'system', 'system')
  ON CONFLICT (organization_id)
  DO UPDATE SET
    legal_name = EXCLUDED.legal_name,
    trade_name = EXCLUDED.trade_name,
    timezone = EXCLUDED.timezone,
    currency_code = EXCLUDED.currency_code,
    updated_by = 'system',
    updated_at = NOW()
  RETURNING id, organization_id, legal_name
`;

export const createPayrollTenantSeedRepository = ({ prisma }) => {
  if (!prisma?.$queryRawUnsafe) throw new TypeError('A Prisma payroll client is required.');
  return {
    async upsertOrganizationTenant(organization) {
      const organizationId = String(organization?._id || '');
      if (!organizationId) throw new Error('Organization ID is required.');
      const legalName = String(organization.name || 'Organization');
      const tradeName = String(organization.code || organization.name || 'Organization');
      const timezone = String(organization.timezone || 'Asia/Kolkata');
      const rows = await prisma.$queryRawUnsafe(UPSERT_ORGANIZATION_TENANT, organizationId, legalName, tradeName, timezone, 'INR');
      if (!rows?.[0]) throw new Error('Payroll tenant upsert returned no row.');
      return rows[0];
    },
  };
};
