import mongoose from 'mongoose';

export const createOrganizationDocumentModels = connection => {
  const objectId = mongoose.Schema.Types.ObjectId;
  const history = new mongoose.Schema({
    filePath: String, publicId: String, resourceType: String, fileType: String, fileName: String,
    fileSize: Number, documentNumber: String, expiryDate: Date, remarks: String,
    uploadedBy: { type: objectId, ref: 'users' }, uploadedAt: { type: Date, default: Date.now },
    action: { type: String, enum: ['UPLOAD','REPLACE','DELETE'], default: 'UPLOAD' },
  }, { _id: false });
  const schema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    documentCategory: { type: String, required: true }, documentKey: { type: String, required: true },
    documentName: { type: String, required: true }, documentNumber: { type: String, default: '' },
    filePath: { type: String, required: true }, publicId: { type: String, required: true },
    resourceType: { type: String, default: 'auto' }, fileType: { type: String, required: true },
    fileName: { type: String, required: true }, fileSize: { type: Number, default: 0 },
    uploadedBy: { type: objectId, ref: 'users', required: true }, uploadedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null }, status: { type: String, enum: ['ACTIVE','EXPIRED','PENDING'], default: 'ACTIVE' },
    remarks: { type: String, default: '' }, isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }, deletedBy: { type: objectId, ref: 'users', default: null },
    uploadHistory: { type: [history], default: [] },
  }, { timestamps: true, collection: 'organization_documents', autoCreate: false, autoIndex: false });
  schema.index({ organizationId: 1, documentKey: 1, isDeleted: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
  schema.index({ organizationId: 1, status: 1 });
  schema.index({ organizationId: 1, expiryDate: 1 });
  const OrganizationDocument = connection.models.organization_documents || connection.model('organization_documents', schema, 'organization_documents');
  return {
    OrganizationDocument,
    OrgUser: connection.models.org_users || connection.model('org_users', new mongoose.Schema({}, { strict: false, collection: 'org_users', autoCreate: false, autoIndex: false }), 'org_users'),
    Role: connection.models.roles || connection.model('roles', new mongoose.Schema({}, { strict: false, collection: 'roles', autoCreate: false, autoIndex: false }), 'roles'),
    Notification: connection.models.notifications || connection.model('notifications', new mongoose.Schema({}, { strict: false, collection: 'notifications', autoCreate: false, autoIndex: false }), 'notifications'),
  };
};
