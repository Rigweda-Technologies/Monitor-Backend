import mongoose from 'mongoose';
import { httpError } from '../../plugins/errors.js';

const id = value => mongoose.Types.ObjectId.isValid(String(value || '')) ? new mongoose.Types.ObjectId(value) : value;
const isSuperAdminByMembership = async (OrgUser, userId) => {
  const memberships = await OrgUser.find({ userId }).populate('roleIds');
  return memberships.some(membership => (membership.roleIds || []).some(role => ['superadmin','super_admin'].includes(String(role?.slug || '').toLowerCase())));
};

const nameCase = value => String(value || '').trim().replace(/\s+/g,' ').split(' ').map(part=>part.split('-').map(segment=>segment?segment[0].toUpperCase()+segment.slice(1).toLowerCase():segment).join('-')).join(' ');
const deriveNames = email => { const parts=String(email||'').split('@')[0].split(/[._-]+/).map(nameCase).filter(Boolean); return { firstName:parts[0]||'Organization',lastName:parts.slice(1).join(' ')||'Admin' }; };
const generateEmployeeCode = async (models,organizationId) => {
  const settings=await models.OrgSettings.findOne({organizationId},'employeeIdPrefix').lean();
  const prefix=String(settings?.employeeIdPrefix||process.env.EMPLOYEE_ID_PREFIX||process.env.EMPLOYEE_CODE_PREFIX||'LV').trim().toUpperCase()||'LV';
  const escaped=prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp(`^${escaped}-(\\d+)$`,'i');
  const employees=await models.Employee.find({organizationId,employeeCode:{$regex:`^${escaped}-`,$options:'i'}}).select('employeeCode');
  let sequence=employees.reduce((max,employee)=>Math.max(max,Number(pattern.exec(String(employee.employeeCode||''))?.[1]||0)),0);
  for(;;){sequence+=1;const employeeCode=`${prefix}-${String(sequence).padStart(4,'0')}`;if(!await models.Employee.findOne({organizationId,employeeCode},'_id'))return employeeCode;}
};

const lifecycleActions = new Set(['soft_delete','restore','hard_delete']);
const generatedPayrollTables = ['payroll_run_components','payroll_run_employees','payroll_run_audit_entries','payroll_runs','payroll_adjustments','payroll_arrears','payroll_loans','payroll_reimbursements','payroll_attendance_snapshot_days','payroll_attendance_snapshots','payroll_action_idempotency'];
const setupPayrollTables = ['employee_payroll_revision_history','employee_bank_details','employee_statutory_details','employee_salary_structures','employee_payroll_profiles','component_formulas','earning_components','deduction_components','employer_contribution_components','payroll_settings','pay_periods','pay_groups'];
const confirmation = (organization,provided) => { if(!organization.code||String(organization.code).trim().toUpperCase()!==String(provided||'').trim().toUpperCase())throw httpError(400,`Confirmation failed. Enter organization code "${organization.code||''}" to continue.`); };
const softDeletedEmail = (email,code,now) => { const [local='user',domain='deleted.local']=String(email||'').trim().toLowerCase().split('@');return `${local}+deleted-${String(code||'org').toLowerCase()}-${now().getTime()}@${domain}`; };
const removeOrganizationContext = (user,organizationId) => {
  const organizations=Array.isArray(user.organizationIds)?user.organizationIds:[];
  user.organizationIds=organizations.filter(value=>String(value)!==String(organizationId));
  if(String(user.activeOrganizationId||'')===String(organizationId))user.activeOrganizationId=user.organizationIds[0]||null;
  if(Array.isArray(user.tokenList))user.tokenList=user.tokenList.filter(token=>String(token?.organizationId||'')!==String(organizationId));
};

export const createOrganizationService = ({ models, seedOrganizationRoles = async () => {}, initializeLeaveBalance = async () => {}, isSuperAdmin = null, lifecycleAction, clearPayrollData, payrollRepository, now = () => new Date() }) => {
  const superAdmin = userId => isSuperAdmin ? isSuperAdmin(userId) : isSuperAdminByMembership(models.OrgUser, userId);
  const lifecycle = async ({organizationId,action,confirmationCode,actorUserId}) => {
    if(!lifecycleActions.has(action))throw httpError(400,'Invalid action. Use soft_delete, restore, or hard_delete.');
    if(!await superAdmin(actorUserId))throw httpError(403,'Only SuperAdmin can perform organization lifecycle actions');
    const organization=await models.Organization.findById(organizationId);
    if(!organization)throw httpError(404,'Organization not found');
    if(String(organization.code||'').toUpperCase()==='SYSTEM')throw httpError(400,'SYSTEM organization cannot be deleted');
    confirmation(organization,confirmationCode);
    if(action==='soft_delete'){
      const memberships=await models.OrgUser.find({organizationId}).select('userId');
      const userIds=[...new Set(memberships.map(row=>String(row.userId)).filter(Boolean))].map(id);
      const counts=userIds.length?await models.OrgUser.aggregate([{$match:{userId:{$in:userIds}}},{$group:{_id:'$userId',count:{$sum:1}}}]):[];
      const countMap=new Map(counts.map(row=>[String(row._id),Number(row.count||0)]));
      const users=userIds.length?await models.User.find({_id:{$in:userIds}}):[];
      let renamedUsers=0,skippedUsers=0;
      for(const user of users){
        if(Number(countMap.get(String(user._id))||0)!==1||String(user.softDeleteMeta?.organizationId||'')===String(organization._id)){skippedUsers++;continue;}
        const email=String(user.email||'').trim().toLowerCase();
        user.softDeleteMeta={organizationId:organization._id,originalEmail:email,deletedAt:now()};
        user.email=softDeletedEmail(email,organization.code,now);user.status='inactive';
        if(String(user.activeOrganizationId||'')===String(organization._id))user.activeOrganizationId=null;
        if(Array.isArray(user.tokenList))user.tokenList=user.tokenList.filter(token=>String(token?.organizationId||'')!==String(organization._id));
        await user.save();renamedUsers++;
      }
      organization.status='inactive';organization.isSoftDeleted=true;organization.softDeletedAt=now();organization.softDeletedBy=actorUserId||null;await organization.save();
      return {action,organizationId:String(organization._id),renamedUsers,skippedUsers};
    }
    if(action==='restore'){
      const users=await models.User.find({'softDeleteMeta.organizationId':organization._id});let restoredUsers=0,conflicts=0;
      for(const user of users){
        const originalEmail=String(user.softDeleteMeta?.originalEmail||'').trim().toLowerCase();
        if(!originalEmail){user.softDeleteMeta={organizationId:null,originalEmail:null,deletedAt:null};await user.save();continue;}
        const existing=await models.User.findOne({_id:{$ne:user._id},email:originalEmail}).select('_id');
        if(existing){conflicts++;continue;}
        user.email=originalEmail;if(user.status==='inactive')user.status='active';user.softDeleteMeta={organizationId:null,originalEmail:null,deletedAt:null};await user.save();restoredUsers++;
      }
      organization.status='active';organization.isSoftDeleted=false;organization.softDeletedAt=null;organization.softDeletedBy=null;await organization.save();
      return {action,organizationId:String(organization._id),restoredUsers,conflicts};
    }
    if(!models.scopedModels)throw httpError(503,'Organization scoped model registry is not configured');
    const payrollStats=payrollRepository?.deleteTenantForOrganization?await payrollRepository.deleteTenantForOrganization(String(organization._id)):{payrollTenantDeleted:0};
    const deletedByModel={};
    for(const [modelName,model] of Object.entries(models.scopedModels)){
      if(['organizations','users'].includes(modelName.toLowerCase())||!model?.schema?.path('organizationId'))continue;
      const result=await model.deleteMany({organizationId:organization._id});deletedByModel[modelName]=Number(result?.deletedCount||0);
    }
    const users=await models.User.find({$or:[{organizationIds:organization._id},{'softDeleteMeta.organizationId':organization._id}]});
    let detachedUsers=0,deletedUsers=0;
    for(const user of users){
      const before=(user.organizationIds||[]).length;removeOrganizationContext(user,organization._id);
      if(String(user.softDeleteMeta?.organizationId||'')===String(organization._id))user.softDeleteMeta={organizationId:null,originalEmail:null,deletedAt:null};
      if(before!==(user.organizationIds||[]).length)detachedUsers++;
      if(!(user.organizationIds||[]).length){await models.User.deleteOne({_id:user._id});deletedUsers++;continue;}
      await user.save();
    }
    const deleted=await models.Organization.deleteOne({_id:organization._id});
    return {action,organizationId:String(organization._id),deletedByModel,payrollTenantDeleted:payrollStats.payrollTenantDeleted,payrollCascadeDeleted:payrollStats.payrollTenantDeleted>0,detachedUsers,deletedUsers,deactivatedUsers:0,organizationDeleted:Number(deleted?.deletedCount||0)>0};
  };
  const clearPayroll = async ({organizationId,mode='generated',confirmationCode,actorUserId}) => {
    if(!['generated','all'].includes(String(mode)))throw httpError(400,'Invalid payroll clear mode. Use generated or all.');
    if(!await superAdmin(actorUserId))throw httpError(403,'Only SuperAdmin can perform organization lifecycle actions');
    const organization=await models.Organization.findById(organizationId);
    if(!organization)throw httpError(404,'Organization not found');
    if(String(organization.code||'').toUpperCase()==='SYSTEM')throw httpError(400,'SYSTEM organization cannot be deleted');
    confirmation(organization,confirmationCode);
    if(!payrollRepository?.enabled)return {action:'clear_payroll',organizationId:String(organization._id),mode,payrollEnabled:false,payrollTenantFound:false,tenantId:null,clearedTables:{},clearedRowCount:0};
    if(!payrollRepository.clearOrganization)throw httpError(500,'Payroll Postgres pool unavailable');
    try{
      const result=await payrollRepository.clearOrganization({organizationId:String(organization._id),mode,organizationCode:String(organization.code||''),tables:mode==='all'?[...generatedPayrollTables,...setupPayrollTables]:generatedPayrollTables});
      if(!result.payrollTenantFound)return {action:'clear_payroll',organizationId:String(organization._id),mode,payrollEnabled:true,payrollTenantFound:false,tenantId:null,clearedTables:{},clearedRowCount:0};
      return {action:'clear_payroll',organizationId:String(organization._id),organizationCode:String(organization.code||''),mode,payrollEnabled:true,payrollTenantFound:true,tenantId:result.tenantId,clearedTables:result.clearedTables,clearedRowCount:Object.values(result.clearedTables||{}).reduce((sum,count)=>sum+Number(count||0),0)};
    }catch(error){throw httpError(500,'Failed to clear organization payroll data');}
  };
  return {
    async create({ body, user }) {
      if (!await superAdmin(user?.userId)) throw httpError(403, 'Only SuperAdmin can create organizations');
      const organization = await models.Organization.create({ name: body.name, code: body.code, timezone: body.timezone, currency: body.currency });
      await seedOrganizationRoles(organization._id);
      if (!body.adminUserId) return organization;
      if (String(user?.userId) === String(body.adminUserId)) throw httpError(400, 'SuperAdmin cannot be assigned as an organization admin');
      const admin = await models.User.findById(body.adminUserId);
      if (!admin) throw httpError(404, 'Admin user not found');
      if (await superAdmin(admin._id)) throw httpError(400, 'SuperAdmin cannot be assigned as an organization admin');
      let role = body.adminRoleId ? await models.Role.findOne({ _id: body.adminRoleId, organizationId: organization._id }) : null;
      if (!role) role = await models.Role.findOne({ slug: 'org-admin', organizationId: organization._id });
      if (!role) throw httpError(400, 'Admin role not found for organization');
      if (!(admin.organizationIds || []).some(orgId => String(orgId) === String(organization._id))) {
        admin.organizationIds.push(organization._id);
        admin.activeOrganizationId = organization._id;
        await admin.save();
      }
      await models.OrgUser.create({ userId: admin._id, organizationId: organization._id, roleIds: [role._id] });
      let employee=await models.Employee.findOne({organizationId:organization._id,userId:admin._id,isDeleted:false});
      if(!employee){
        const existing=await models.Employee.findOne({userId:admin._id}).sort({createdAt:-1});
        const names=deriveNames(admin.email);
        const priorOrganizationId=String(existing?.organizationId||'');
        const employeePayload={organizationId:organization._id,userId:admin._id,firstName:nameCase(existing?.firstName||names.firstName),lastName:nameCase(existing?.lastName||names.lastName),employeeCode:await generateEmployeeCode(models,organization._id),departmentId:existing?.departmentId||undefined,designationId:existing?.designationId||undefined,dateOfJoining:existing?.dateOfJoining||new Date(),employmentType:existing?.employmentType||'full_time',managerId:existing?.managerId||undefined,shiftId:existing?.shiftId||undefined,phone:existing?.phone||'',profileCompleted:existing?.profileCompleted||false,profileImage:existing?.profileImage||null,status:existing?.status||'active',employmentLifecycleStatus:existing?.employmentLifecycleStatus||'confirmed'};
        if(existing){existing.set(employeePayload);await existing.save();employee=existing;if(priorOrganizationId!==String(organization._id))await initializeLeaveBalance(employee,organization._id);}
        else{employee=await models.Employee.create(employeePayload);await initializeLeaveBalance(employee,organization._id);}
      }
      return organization;
    },
    async update(organizationId, body) {
      const organization = await models.Organization.findByIdAndUpdate(organizationId, body, { new: true });
      if (!organization) throw httpError(404, 'Organization not found');
      return organization;
    },
    async getById(organizationId) {
      const organization = await models.Organization.findById(organizationId);
      if (!organization) throw httpError(404, 'Organization not found');
      return organization;
    },
    async list({ user }) {
      if (await superAdmin(user.userId)) return models.Organization.find({ code: { $ne: 'SYSTEM' } }).sort({ createdAt: -1 });
      const memberships = await models.OrgUser.find({ userId: user.userId }).select('organizationId');
      return models.Organization.find({ _id: { $in: memberships.map(membership => membership.organizationId) }, status: 'active' }).sort({ createdAt: -1 });
    },
    async remove(organizationId) {
      const organization = await models.Organization.findByIdAndUpdate(organizationId, { status: 'inactive', isSoftDeleted: true, softDeletedAt: new Date(), softDeletedBy: null }, { new: true });
      if (!organization) throw httpError(404, 'Organization not found');
      return true;
    },
    async lifecycleAction(request) {
      return lifecycleAction ? lifecycleAction(request) : lifecycle(request);
    },
    async clearPayrollData(request) {
      return clearPayrollData ? clearPayrollData(request) : clearPayroll(request);
    },
  };
};

export const organizationId = id;
