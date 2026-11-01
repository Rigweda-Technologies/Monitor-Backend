import mongoose from 'mongoose';

export const createProjectModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const projectSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    projectName: { type: String, required: true, trim: true }, projectNameKey: { type: String, required: true, trim: true, lowercase: true }, logoUrl: { type: String, default: '', trim: true },
    clientName: { type: String, required: true, trim: true }, clientCompany: { type: String, default: '', trim: true }, clientEmail: { type: String, default: '', trim: true, lowercase: true }, clientPhone: { type: String, default: '', trim: true }, clientAddress: { type: String, default: '', trim: true },
    actualAmount: { type: Number, required: true, min: 0 }, discountedAmount: { type: Number, required: true, min: 0 }, paidAmount: { type: Number, required: true, min: 0, default: 0 }, paidTo: { type: objectId, ref: 'projectEmployeesV2', default: null }, pendingAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active','on_hold','completed','cancelled'], default: 'active', index: true }, startDate: { type: Date, default: null }, expectedEndDate: { type: Date, default: null }, notes: { type: String, default: '', trim: true },
    mouFile: { fileName: String, fileUrl: String, mimeType: String, uploadedAt: Date }, documentationFile: { fileName: String, fileUrl: String, mimeType: String, uploadedAt: Date }, isDeleted: { type: Boolean, default: false }, deletedAt: { type: Date, default: null }, deletedBy: { type: objectId, ref: 'users', default: null }, createdBy: { type: objectId, ref: 'users', default: null }, updatedBy: { type: objectId, ref: 'users', default: null },
  }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  projectSchema.index({ organizationId: 1, projectNameKey: 1 }, { unique: true });
  projectSchema.pre(/^find/, function () { this.where({ isDeleted: false }); });

  const employeeSchema = new mongoose.Schema({ organizationId: objectId, firstName: String, lastName: String, employeeCode: String, status: String }, { autoCreate: false, autoIndex: false, bufferCommands: false });
  const auditSchema = new mongoose.Schema({ organizationId: { type: objectId, required: true }, userId: { type: objectId, required: true }, module: { type: String, required: true }, action: { type: String, required: true }, entityId: { type: objectId, required: true }, before: Object, after: Object, ipAddress: String, userAgent: String }, { timestamps: true, autoCreate: false, autoIndex: false, bufferCommands: false });
  const Project = connection.models.projects || connection.model('projects', projectSchema, 'projects');
  const Employee = connection.models.projectEmployeesV2 || connection.model('projectEmployeesV2', employeeSchema, 'employees');
  const AuditLog = connection.models.projectAuditLogsV2 || connection.model('projectAuditLogsV2', auditSchema, 'audit_logs');
  return { Project, Employee, AuditLog };
};
