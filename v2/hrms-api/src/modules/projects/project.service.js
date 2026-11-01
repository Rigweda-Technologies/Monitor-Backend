import { httpError } from '../../plugins/errors.js';

const toKey = value => String(value || '').trim().toLowerCase();
const toAmount = (value, fallback = 0) => value === undefined || value === null || value === '' ? Number(fallback) : Number(value);
const computeAmounts = ({ actualAmount, discountedAmount, paidAmount }) => {
  const actual = toAmount(actualAmount); const discounted = toAmount(discountedAmount); const paid = toAmount(paidAmount, 0);
  if ([actual, discounted, paid].some(Number.isNaN)) throw httpError(400, 'Invalid amount values');
  if (actual < 0 || discounted < 0 || paid < 0) throw httpError(400, 'Amounts cannot be negative');
  if (discounted > actual) throw httpError(400, 'Discounted amount cannot exceed actual amount');
  if (paid > discounted) throw httpError(400, 'Paid amount cannot exceed discounted amount');
  return { actualAmount: actual, discountedAmount: discounted, paidAmount: paid, pendingAmount: discounted - paid };
};

export const createProjectService = (models, { uploadDataUri } = {}) => {
  const resolvePaidTo = async ({ organizationId, paidTo }) => {
    if (!paidTo) throw httpError(400, 'Paid To employee is required');
    const employee = await models.Employee.findOne({ _id: paidTo, organizationId }).select('_id');
    if (!employee) throw httpError(400, 'Paid To employee not found');
    return employee._id;
  };
  const uploadProjectFile = async (payload, folder, fallbackName) => {
    if (!payload?.base64Data || !payload?.mimeType) return undefined;
    if (!uploadDataUri) throw httpError(503, 'Project file upload is unavailable');
    const dataUri = `data:${payload.mimeType};base64,${payload.base64Data}`;
    const isPdf = String(payload.mimeType).toLowerCase() === 'application/pdf';
    const uploaded = await uploadDataUri(dataUri, { folder, resource_type: isPdf ? 'raw' : 'auto' });
    return { fileName: payload.fileName || fallbackName, fileUrl: uploaded?.secure_url || '', mimeType: payload.mimeType || '', uploadedAt: new Date() };
  };
  const audit = ({ request, action, entityId, before, after }) => models.AuditLog.create({ organizationId: request.user.organizationId, userId: request.user?._id || request.user?.userId, module: 'projects', action, entityId, before, after, ipAddress: request.ip, userAgent: request.headers?.['user-agent'] || '' });
  return {
    async create(request) {
      const organizationId = request.user.organizationId;
      const projectNameKey = toKey(request.body.projectName);
      if (await models.Project.findOne({ organizationId, projectNameKey }).select('_id')) throw httpError(409, 'Project name already exists');
      const amounts = computeAmounts(request.body);
      const paidTo = await resolvePaidTo({ organizationId, paidTo: request.body.paidTo || null });
      const mouFile = await uploadProjectFile(request.body.mouUpload, 'hrms/project-mou-files', 'project-mou');
      const documentationFile = await uploadProjectFile(request.body.documentationUpload, 'hrms/project-documentation-files', 'project-documentation');
      const project = await models.Project.create({ organizationId, projectName: request.body.projectName, projectNameKey, logoUrl: request.body.logoUrl || '', clientName: request.body.clientName, clientCompany: request.body.clientCompany || '', clientEmail: request.body.clientEmail || '', clientPhone: request.body.clientPhone || '', clientAddress: request.body.clientAddress || '', ...amounts, paidTo, status: request.body.status || 'active', startDate: request.body.startDate || null, expectedEndDate: request.body.expectedEndDate || null, notes: request.body.notes || '', mouFile, documentationFile, createdBy: request.user.userId, updatedBy: request.user.userId });
      await audit({ request, action: 'CREATE', entityId: project._id, after: project.toObject() });
      return project;
    },
    async list(request) {
      const query = { organizationId: request.user.organizationId };
      if (request.query.status && request.query.status !== 'all') query.status = request.query.status;
      if (request.query.search) {
        const search = String(request.query.search).trim();
        query.$or = [{ projectName: { $regex: search, $options: 'i' } }, { clientName: { $regex: search, $options: 'i' } }, { clientCompany: { $regex: search, $options: 'i' } }];
      }
      return models.Project.find(query).populate('paidTo', 'firstName lastName employeeCode').sort({ createdAt: -1 }).lean();
    },
    async getById(request) {
      const project = await models.Project.findOne({ _id: request.params.id, organizationId: request.user.organizationId }).populate('paidTo', 'firstName lastName employeeCode').lean();
      if (!project) throw httpError(404, 'Project not found');
      return project;
    },
    async update(request) {
      const project = await models.Project.findOne({ _id: request.params.id, organizationId: request.user.organizationId });
      if (!project) throw httpError(404, 'Project not found');
      const before = project.toObject();
      if (request.body.projectName !== undefined) {
        const projectNameKey = toKey(request.body.projectName);
        const duplicate = await models.Project.findOne({ _id: { $ne: project._id }, organizationId: request.user.organizationId, projectNameKey }).select('_id');
        if (duplicate) throw httpError(409, 'Project name already exists');
        project.projectName = request.body.projectName; project.projectNameKey = projectNameKey;
      }
      const amounts = computeAmounts({ actualAmount: request.body.actualAmount !== undefined ? request.body.actualAmount : project.actualAmount, discountedAmount: request.body.discountedAmount !== undefined ? request.body.discountedAmount : project.discountedAmount, paidAmount: request.body.paidAmount !== undefined ? request.body.paidAmount : project.paidAmount });
      Object.assign(project, amounts);
      const paidTo = request.body.paidTo !== undefined ? request.body.paidTo || null : project.paidTo || null;
      project.paidTo = await resolvePaidTo({ organizationId: request.user.organizationId, paidTo });
      for (const field of ['logoUrl','clientName','clientCompany','status']) if (request.body[field] !== undefined) project[field] = request.body[field] || (field === 'logoUrl' || field === 'clientCompany' ? '' : request.body[field]);
      for (const field of ['clientEmail','clientPhone','clientAddress','notes']) if (request.body[field] !== undefined) project[field] = request.body[field] || '';
      if (request.body.startDate !== undefined) project.startDate = request.body.startDate || null;
      if (request.body.expectedEndDate !== undefined) project.expectedEndDate = request.body.expectedEndDate || null;
      if (request.body.mouUpload) { const file = await uploadProjectFile(request.body.mouUpload, 'hrms/project-mou-files', 'project-mou'); if (file) project.mouFile = file; }
      if (request.body.documentationUpload) { const file = await uploadProjectFile(request.body.documentationUpload, 'hrms/project-documentation-files', 'project-documentation'); if (file) project.documentationFile = file; }
      project.updatedBy = request.user.userId;
      await project.save();
      await audit({ request, action: 'UPDATE', entityId: project._id, before, after: project.toObject() });
      return project;
    },
    listEmployees: request => models.Employee.find({ organizationId: request.user.organizationId, status: 'active' }).select('_id firstName lastName employeeCode').sort({ firstName: 1, lastName: 1 }).lean(),
    async remove(request) {
      const project = await models.Project.findOne({ _id: request.params.id, organizationId: request.user.organizationId });
      if (!project) throw httpError(404, 'Project not found');
      const before = project.toObject();
      project.isDeleted = true; project.deletedAt = new Date(); project.deletedBy = request.user.userId; project.updatedBy = request.user.userId;
      await project.save();
      await audit({ request, action: 'DELETE', entityId: project._id, before, after: project.toObject() });
    },
  };
};
