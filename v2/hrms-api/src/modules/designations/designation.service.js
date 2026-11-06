import mongoose from 'mongoose';

const objectId = value => mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;
const audit = (models, request, action, entityId, before, after) => models.AuditLog.create({
  organizationId: request.user.organizationId, userId: request.user._id || request.user.userId,
  module: 'designations', action, entityId, ...(before ? { before } : {}), ...(after ? { after } : {}),
  ipAddress: request.ip, userAgent: request.headers?.['user-agent'] || '',
});
const ensureActiveDepartment = async (models, organizationId, departmentId, nextStatus) => {
  if (nextStatus !== 'active' || !departmentId) return;
  const department = await models.Department.collection.findOne({ _id: objectId(departmentId), organizationId: objectId(organizationId) });
  if (!department || department.isDeleted || department.status !== 'active') {
    throw Object.assign(new Error('Selected department is inactive. Please choose a different active department or reactivate the department first.'), { code: 400 });
  }
};
const viewProjection = {
  _id: 1, organizationId: 1, name: 1, departmentId: 1, status: 1, isDeleted: 1, createdAt: 1, updatedAt: 1, departmentName: '$departments.name',
};
const joinDepartment = [
  { $lookup: { from: 'departments', localField: 'departmentId', foreignField: '_id', as: 'departments' } },
  { $unwind: { path: '$departments', preserveNullAndEmptyArrays: true } },
  { $project: viewProjection },
];

export const createDesignationService = models => ({
  async create(request) {
    await ensureActiveDepartment(models, request.user.organizationId, request.body.departmentId, request.body.status || 'active');
    const designation = await models.Designation.create({ ...request.body, organizationId: request.user.organizationId });
    await audit(models, request, 'CREATE', designation._id, null, designation.toObject());
    return designation;
  },
  async update(request) {
    const designationId = objectId(request.params.id);
    const organizationId = objectId(request.user.organizationId);
    const filter = { _id: designationId, organizationId };
    const before = await models.Designation.collection.findOne(filter);
    if (!before) throw Object.assign(new Error('Designation not found'), { code: 404 });
    const updateDoc = { ...request.body };
    await ensureActiveDepartment(models, organizationId, updateDoc.departmentId || before.departmentId, updateDoc.status || before.status);
    if (updateDoc.status === 'active') Object.assign(updateDoc, { isDeleted: false, deletedAt: null, deletedBy: null });
    await models.Designation.updateOne(filter, { $set: updateDoc });
    const [designation] = await models.Designation.aggregate([
      { $match: { _id: designationId, organizationId } }, ...joinDepartment,
    ]);
    await audit(models, request, 'UPDATE', before._id, before, designation);
    return designation;
  },
  async remove(request) {
    const designation = await models.Designation.findOne({ _id: request.params.id, organizationId: request.user.organizationId, isDeleted: false });
    if (!designation) throw Object.assign(new Error('Designation not found'), { code: 404 });
    if (designation.status === 'inactive') return { alreadyInactive: true, designation: designation.toObject() };
    const before = designation.toObject();
    designation.status = 'inactive';
    await designation.save();
    await audit(models, request, 'DELETE', designation._id, before, designation.toObject());
    return { alreadyInactive: false, designation: designation.toObject() };
  },
  async list(request) {
    const match = { organizationId: new mongoose.Types.ObjectId(request.user.organizationId) };
    if (request.query.departmentId && mongoose.Types.ObjectId.isValid(request.query.departmentId)) match.departmentId = new mongoose.Types.ObjectId(request.query.departmentId);
    if (String(request.query.includeInactive || '').toLowerCase() !== 'true') Object.assign(match, { isDeleted: false, status: 'active' });
    return models.Designation.aggregate([
      { $match: match }, ...joinDepartment,
      { $addFields: { status: { $cond: [{ $eq: ['$isDeleted', true] }, 'inactive', '$status'] } } },
      { $sort: { status: 1, name: 1, departmentName: 1 } },
    ]);
  },
});
