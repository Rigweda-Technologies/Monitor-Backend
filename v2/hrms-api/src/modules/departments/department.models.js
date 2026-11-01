import mongoose from 'mongoose';

export const createDepartmentModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const departmentSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    managerId: { type: objectId, ref: 'employees' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false }, deletedAt: Date, deletedBy: { type: objectId, ref: 'users' },
  }, { timestamps: true, autoCreate: false, autoIndex: false });
  departmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
  departmentSchema.pre(/^find/, function () { this.where({ isDeleted: false }); });

  const employeeSchema = new mongoose.Schema({ userId: objectId, organizationId: objectId }, { collection: 'employees', autoCreate: false, autoIndex: false });
  const auditSchema = new mongoose.Schema({
    organizationId: { type: objectId, required: true }, userId: { type: objectId, required: true },
    module: { type: String, required: true }, action: { type: String, required: true }, entityId: { type: objectId, required: true },
    before: Object, after: Object, ipAddress: String, userAgent: String,
  }, { collection: 'audit_logs', timestamps: true, autoCreate: false, autoIndex: false });
  const roleSchema = new mongoose.Schema({ organizationId: objectId, slug: String }, { collection: 'roles', autoCreate: false, autoIndex: false });
  const get = (name, schema, collection) => connection.models[name] || connection.model(name, schema, collection);
  return {
    Department: get('departments', departmentSchema, 'departments'),
    Employee: get('employees', employeeSchema, 'employees'),
    AuditLog: get('audit_logs', auditSchema, 'audit_logs'),
    Role: get('roles', roleSchema, 'roles'),
  };
};
