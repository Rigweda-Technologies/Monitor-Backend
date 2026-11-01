import mongoose from 'mongoose';
import { httpError } from '../../plugins/errors.js';

const objectId = value => mongoose.Types.ObjectId.isValid(String(value || '')) ? new mongoose.Types.ObjectId(value) : value;
const generateEmployeeCode = async (models, organizationId, env) => {
  const settings = await models.OrgSettings.findOne({ organizationId }, 'employeeIdPrefix').lean();
  const prefix = String(settings?.employeeIdPrefix || env.EMPLOYEE_ID_PREFIX || env.EMPLOYEE_CODE_PREFIX || 'LV').trim().toUpperCase() || 'LV';
  let sequence = await models.Employee.countDocuments({ organizationId, isDeleted:false });
  for (;;) { sequence += 1; const employeeCode=`${prefix}-${String(sequence).padStart(4,'0')}`; if(!await models.Employee.findOne({organizationId,employeeCode},'_id'))return employeeCode; }
};

export const createUserAdministrationService = ({ models, hashPassword, initializeLeaveBalance = async () => {}, sendOnboardingEmail = async () => {}, env = process.env }) => ({
  async list({ organizationId, query = {} }) {
    const page = Number(query.page || 1), limit = Number(query.limit || 20), skip = (page - 1) * limit;
    const userFilter = {};
    if (query.search) userFilter.email = { $regex:query.search, $options:'i' };
    const [memberships,total] = await Promise.all([
      models.OrgUser.find({ organizationId }).populate({ path:'userId',select:'email status activeOrganizationId',match:userFilter }).populate({ path:'roleIds',select:'name slug' }).skip(skip).limit(limit),
      models.OrgUser.countDocuments({ organizationId }),
    ]);
    const items=memberships.filter(membership=>membership.userId).map(membership=>({ userId:membership.userId._id,email:membership.userId.email,status:membership.userId.status,activeOrganizationId:membership.userId.activeOrganizationId,roles:membership.roleIds }));
    return { items,pagination:{ total,page,limit,totalPages:Math.ceil(total/limit) } };
  },
  async create({ body, creator }) {
    const organizationId=creator?.activeOrganizationId||creator?.organizationId;
    if(!organizationId)throw httpError(400,'No active organization selected');
    const email=body.email.toLowerCase().trim();
    if(await models.User.findOne({email}))throw httpError(409,'User with this email already exists');
    const roles=await models.Role.find({ _id:{ $in:body.roleIds },organizationId });
    if(roles.length!==body.roleIds.length)throw httpError(400,'Invalid role(s) for this organization');
    const user=await models.User.create({ email,password:await hashPassword(body.password),organizationIds:[organizationId],activeOrganizationId:organizationId,status:'active',passwordChangeRequired:true });
    await models.OrgUser.create({ userId:user._id,organizationId,roleIds:body.roleIds.map(objectId) });
    const employeeCode=await generateEmployeeCode(models,organizationId,env);
    const employee=await models.Employee.create({ organizationId,userId:user._id,firstName:body.firstName,lastName:body.lastName,employeeCode,departmentId:body.departmentId||undefined,designationId:body.designationId||undefined,dateOfJoining:body.dateOfJoining,employmentType:body.employmentType,managerId:body.managerId||undefined,shiftId:body.shiftId||undefined,profileCompleted:false });
    await initializeLeaveBalance(employee,organizationId);
    await sendOnboardingEmail({ email,password:body.password,employeeName:`${body.firstName} ${body.lastName}`.trim(),organizationName:'Luvetha' }).catch(()=>{});
    return { userId:user._id,email:user.email };
  },
});
