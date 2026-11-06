import mongoose from 'mongoose';

const objectId = value => mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;
const managerObjectId = value => value && String(value).trim() && mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : undefined;
const audit = async (models, request, action, entityId, before, after) => models.AuditLog.create({
  organizationId: request.user.organizationId, userId: request.user._id || request.user.userId,
  module: 'departments', action, entityId, before, after, ipAddress: request.ip,
  userAgent: request.headers?.['user-agent'] || '',
});

export const createDepartmentService = ({ models, isSuperAdmin = async () => false }) => ({
  async create(request) {
    let { organizationId, managerId } = request.body;
    if (!organizationId) organizationId = request.user.organizationId;
    managerId = managerObjectId(managerId);
    if (!managerId) {
      const employee = await models.Employee.findOne({ userId: request.user.userId, organizationId }).select('_id');
      if (employee) managerId = employee._id;
    }
    const exists = await models.Department.findOne({ organizationId, code: request.body.code });
    if (exists) throw Object.assign(new Error('Department code already exists'), { code: 400 });
    const payload = { ...request.body, organizationId, managerId };
    if (!managerId) delete payload.managerId;
    const department = await models.Department.create(payload);
    await audit(models, request, 'CREATE', department._id, null, department.toObject());
    return department;
  },
  async update(request) {
    const departmentId = objectId(request.params.id);
    const organizationId = objectId(request.user.organizationId);
    const filter = { _id: departmentId, organizationId };
    const before = await models.Department.collection.findOne(filter);
    if (!before) throw Object.assign(new Error('Department not found'), { code: 404 });
    const updateDoc = { ...request.body };
    const normalizedManagerId = managerObjectId(updateDoc.managerId);
    if (updateDoc.managerId !== undefined) {
      if (normalizedManagerId) updateDoc.managerId = normalizedManagerId;
      else delete updateDoc.managerId;
    }
    if (updateDoc.status === 'active') Object.assign(updateDoc, { isDeleted: false, deletedAt: null, deletedBy: null });
    const updateOperation = { $set: updateDoc };
    if (request.body.managerId !== undefined && !normalizedManagerId) updateOperation.$unset = { managerId: '' };
    await models.Department.updateOne(filter, updateOperation);
    const department = await models.Department.collection.findOne(filter);
    await audit(models, request, 'UPDATE', before._id, before, department);
    return department;
  },
  async remove(request) {
    const department = await models.Department.findOne({ _id: request.params.id, organizationId: request.user.organizationId, isDeleted: false });
    if (!department) throw Object.assign(new Error('Department not found'), { code: 404 });
    if (department.status === 'inactive') return { alreadyInactive: true, department: department.toObject() };
    const before = department.toObject();
    department.status = 'inactive';
    await department.save();
    await audit(models, request, 'DELETE', department._id, before, department.toObject());
    return { alreadyInactive: false, department: department.toObject() };
  },
  async getById(request) {
    const department = await models.Department.collection.findOne({ _id: objectId(request.params.id), organizationId: objectId(request.user.organizationId) });
    if (!department) throw Object.assign(new Error('Department not found'), { code: 404 });
    return { ...department, status: department.isDeleted ? 'inactive' : department.status };
  },
  async list(request) {
    const elevated = await isSuperAdmin(request.user.userId);
    const requested = request.query.organizationId;
    const organizationId = elevated && requested ? requested : request.user.organizationId;
    const includeInactive = String(request.query.includeInactive || '').toLowerCase() === 'true';
    const match = { organizationId: objectId(organizationId) };
    if (!includeInactive) Object.assign(match, { isDeleted: false, status: 'active' });
    return models.Department.aggregate([
      { $match: match },
      { $addFields: { status: { $cond: [{ $eq: ['$isDeleted', true] }, 'inactive', '$status'] } } },
      { $sort: { status: 1, name: 1 } },
    ]);
  },
});
