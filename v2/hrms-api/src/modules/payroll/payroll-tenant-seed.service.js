export const createPayrollTenantSeedService = ({ Organization, upsertOrganizationTenant }) => {
  /** @param {{ organizationId?: string, apply?: boolean }} [options] */
  return async ({ organizationId, apply = false } = {}) => {
    const filter = organizationId ? { _id: organizationId } : {};
    const organizations = await Organization.find(filter).select('_id name code timezone currency').lean();
    if (!apply) return {
      mode: 'dry-run',
      organizationCount: organizations.length,
      organizations: organizations.map(({ _id, name, code }) => ({ organizationId: String(_id), name, code })),
    };

    const tenants = [];
    for (const organization of organizations) {
      try {
        tenants.push(await upsertOrganizationTenant(organization));
      } catch (cause) {
        throw Object.assign(new Error(`Payroll tenant sync failed after ${tenants.length} successful organization(s).`, { cause }), {
          completedCount: tenants.length,
        });
      }
    }
    return { mode: 'applied', organizationCount: tenants.length, tenants };
  };
};
