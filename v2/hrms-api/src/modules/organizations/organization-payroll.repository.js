const allowedTables = new Set([
  'payroll_run_components','payroll_run_employees','payroll_run_audit_entries','payroll_runs','payroll_adjustments','payroll_arrears','payroll_loans','payroll_reimbursements','payroll_attendance_snapshot_days','payroll_attendance_snapshots','payroll_action_idempotency',
  'employee_payroll_revision_history','employee_bank_details','employee_statutory_details','employee_salary_structures','employee_payroll_profiles','component_formulas','earning_components','deduction_components','employer_contribution_components','payroll_settings','pay_periods','pay_groups',
]);
const quoteIdentifier = value => `"${String(value).replace(/"/g,'""')}"`;

export const createOrganizationPayrollRepository = ({ prisma, enabled = Boolean(prisma) }) => ({
  enabled,
  async clearOrganization({ organizationId, tables }) {
    if(!enabled||!prisma)throw new Error('Payroll Prisma client is unavailable');
    const requested=[...new Set(tables||[])];
    if(requested.some(table=>!allowedTables.has(table)))throw new Error('Payroll cleanup table is not allowlisted');
    return prisma.$transaction(async transaction=>{
      const tenants=await transaction.$queryRawUnsafe('SELECT id FROM payroll_tenants WHERE organization_id = $1 LIMIT 1',organizationId);
      const tenantId=String(tenants?.[0]?.id||'').trim();
      if(!tenantId)return {payrollTenantFound:false,tenantId:null,clearedTables:{}};
      const present=await transaction.$queryRawUnsafe('SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = ANY($2::text[])','public',requested);
      const existing=new Set((present||[]).map(row=>String(row.table_name)));
      const clearedTables={};
      for(const table of requested){
        if(!existing.has(table)){clearedTables[table]=0;continue;}
        const result=await transaction.$executeRawUnsafe(`DELETE FROM ${quoteIdentifier(table)} WHERE tenant_id = $1`,tenantId);
        clearedTables[table]=Number(result||0);
      }
      return {payrollTenantFound:true,tenantId,clearedTables};
    });
  },
  async deleteTenantForOrganization(organizationId) {
    if(!enabled||!prisma)return {payrollTenantDeleted:0};
    const deleted=await prisma.$executeRawUnsafe('DELETE FROM payroll_tenants WHERE organization_id = $1',organizationId);
    return {payrollTenantDeleted:Number(deleted||0)};
  },
  async countTenantsForOrganization(organizationId) {
    if(!enabled||!prisma)return 0;
    const rows=await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM payroll_tenants WHERE organization_id = $1',organizationId);
    return Number(rows?.[0]?.count||0);
  },
});
