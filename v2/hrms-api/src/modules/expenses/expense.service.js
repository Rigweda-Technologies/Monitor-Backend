import path from 'node:path';
import { httpError } from '../../plugins/errors.js';

const normalizeText = value => String(value || '').trim().toLowerCase();
const dayStart = value => { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; };
const dayEnd = value => { const date = new Date(value); date.setHours(23, 59, 59, 999); return date; };
const duplicateQuery = ({ organizationId, title, vendor, expenseDate, amount, taxAmount, excludeId }) => ({ organizationId, isDeleted: false, titleKey: normalizeText(title), vendorKey: normalizeText(vendor), amount: Number(amount || 0), taxAmount: Number(taxAmount || 0), expenseDate: { $gte: dayStart(expenseDate), $lte: dayEnd(expenseDate) }, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
const pendingActive = (expense, verb) => { if (!expense) throw httpError(500, 'Expense not found'); if (expense.isDeleted) throw httpError(500, 'Expense is deleted'); if (expense.status !== 'pending') throw httpError(500, `Only pending expenses can be ${verb}`); };
const actorId = async (models, request) => (await models.Employee.findOne({ userId: request.user.userId, organizationId: request.user.organizationId }).select('_id'))?._id || null;
const parseReceiptInput = ({ fileName, fileData }) => {
  if (!fileName || !String(fileName).trim()) throw httpError(500, 'File name is required');
  if (!fileData || !String(fileData).trim()) throw httpError(500, 'File data is required');
  const raw = String(fileData).trim(); const match = raw.match(/^data:([^;]+);base64,(.+)$/);
  const mime = match ? match[1].toLowerCase() : ''; const base64 = match ? match[2] : raw; const extension = path.extname(String(fileName).toLowerCase());
  const mimeByExt = { '.pdf':'application/pdf', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' };
  if (!Object.hasOwn(mimeByExt, extension)) throw httpError(500, 'Unsupported receipt file type');
  if (mime && !['application/pdf','image/png','image/jpeg','image/webp'].includes(mime)) throw httpError(500, 'Unsupported receipt MIME type');
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) throw httpError(500, 'Invalid file data');
  if (buffer.length > 5 * 1024 * 1024) throw httpError(500, 'Receipt file exceeds 5MB');
  const normalizedMime = mime || mimeByExt[extension];
  return { extension, dataUri: `data:${normalizedMime};base64,${base64}` };
};
const applyAction = ({ expense, status, rejectionReason, actorEmployeeId, now = new Date() }) => ({ ...expense, status, rejectionReason: status === 'rejected' ? rejectionReason || '' : '', actionBy: actorEmployeeId || null, actionAt: now, updatedBy: actorEmployeeId || null });

export const createExpenseService = (models, { audit, uploadDataUri = async () => { throw httpError(503, 'Receipt upload provider is not configured'); }, notifications = null } = {}) => {
  const writeAudit = async ({ request, module, action, entityId, before, after }) => {
    if (audit) return audit({ req: request, module, action, entityId, before, after });
    return models.AuditLog.create({ organizationId: request.user.organizationId, userId: request.user?._id || request.user?.userId, module, action, entityId, before, after, ipAddress: request.ip, userAgent: request.headers?.['user-agent'] || '' });
  };
  const resolveVendor = async ({ organizationId, vendorId, vendorName }) => {
    if (vendorId) {
      const vendor = await models.ExpenseVendor.findOne({ _id: vendorId, organizationId, isActive: true }).select('_id name nameKey');
      if (!vendor) throw httpError(500, 'Vendor not found or inactive');
      return { vendorId: vendor._id, vendor: vendor.name, vendorKey: vendor.nameKey };
    }
    const vendor = vendorName || '';
    return { vendorId: null, vendor, vendorKey: normalizeText(vendor) };
  };
  const service = {
    async createExpense(request) {
      const createdBy = await actorId(models, request);
      const vendor = await resolveVendor({ organizationId: request.user.organizationId, vendorId: request.body.vendorId, vendorName: request.body.vendor || '' });
      const reimbursementMethod = request.body.reimbursementMethod || 'none';
      const reimbursementAmount = request.body.reimbursementAmount !== undefined ? Number(request.body.reimbursementAmount || 0) : Number(request.body.amount || 0) + Number(request.body.taxAmount || 0);
      const purchasedBy = reimbursementMethod === 'payroll' ? (request.body.purchasedBy || createdBy || null) : null;
      if (reimbursementMethod === 'payroll' && !purchasedBy) throw httpError(500, 'Purchased by employee is required for payroll reimbursement');
      const payload = { organizationId: request.user.organizationId, category: request.body.category, title: request.body.title, titleKey: normalizeText(request.body.title), ...vendor, expenseDate: dayStart(request.body.expenseDate), amount: Number(request.body.amount || 0), taxAmount: Number(request.body.taxAmount || 0), paymentMode: request.body.paymentMode || 'bank_transfer', reimbursementMethod, purchasedBy, reimbursementStatus: reimbursementMethod === 'payroll' ? 'pending' : 'not_applicable', reimbursementAmount: reimbursementMethod === 'payroll' ? reimbursementAmount : 0, reimbursementPayrollMonth: request.body.reimbursementPayrollMonth || '', reimbursementNote: request.body.reimbursementNote || '', notes: request.body.notes || '', receiptUrl: request.body.receiptUrl || '', status: 'pending', createdBy, updatedBy: createdBy };
      if (await models.Expense.findOne(duplicateQuery({ organizationId: payload.organizationId, title: payload.title, vendor: payload.vendor, expenseDate: payload.expenseDate, amount: payload.amount, taxAmount: payload.taxAmount })).select('_id')) throw httpError(500, 'Duplicate expense exists for same title/vendor/date/amount');
      const expense = await models.Expense.create(payload);
      await writeAudit({ request, module: 'expenses', action: 'CREATE', entityId: expense._id, after: expense.toObject() });
      return expense;
    },
    async listExpenses(request) {
      const query = { organizationId: request.user.organizationId, isDeleted: false };
      if (String(request.query.includeDeleted || 'false') === 'true') delete query.isDeleted;
      if (request.query.category && request.query.category !== 'all') query.category = request.query.category;
      if (request.query.status && request.query.status !== 'all') query.status = request.query.status;
      if (request.query.startDate || request.query.endDate) { query.expenseDate = {}; if (request.query.startDate) query.expenseDate.$gte = dayStart(request.query.startDate); if (request.query.endDate) query.expenseDate.$lte = dayEnd(request.query.endDate); }
      if (request.query.employeeId) query.$or = [{ purchasedBy: request.query.employeeId }, { createdBy: request.query.employeeId }];
      if (request.query.reimbursementStatus) query.reimbursementStatus = request.query.reimbursementStatus;
      const page = Math.max(1, Number(request.query.page || 1)); const limit = Math.min(200, Math.max(1, Number(request.query.limit || 100))); const skip = (page - 1) * limit;
      let find = models.Expense.find(query);
      for (const [field, selection] of [['purchasedBy','firstName lastName employeeCode'],['createdBy','firstName lastName employeeCode'],['updatedBy','firstName lastName employeeCode'],['actionBy','firstName lastName employeeCode'],['deletedBy','firstName lastName employeeCode'],['restoredBy','firstName lastName employeeCode'],['reimbursedBy','firstName lastName employeeCode'],['vendorId','name isActive']]) find = find.populate(field, selection);
      const base = find.sort({ expenseDate: -1, createdAt: -1 }).lean();
      if (request.query.page === undefined && request.query.limit === undefined) return base.skip(skip).limit(limit);
      const [items, total] = await Promise.all([base.skip(skip).limit(limit), models.Expense.countDocuments(query)]);
      return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
    },
    async getSummary(request) {
      const query = { organizationId: request.user.organizationId, isDeleted: false };
      if (request.query.category && request.query.category !== 'all') query.category = request.query.category;
      if (request.query.status && request.query.status !== 'all') query.status = request.query.status;
      if (request.query.startDate || request.query.endDate) { query.expenseDate = {}; if (request.query.startDate) query.expenseDate.$gte = dayStart(request.query.startDate); if (request.query.endDate) query.expenseDate.$lte = dayEnd(request.query.endDate); }
      if (request.query.employeeId) query.$or = [{ purchasedBy: request.query.employeeId }, { createdBy: request.query.employeeId }];
      if (request.query.reimbursementStatus) query.reimbursementStatus = request.query.reimbursementStatus;
      const group = { $group: { _id: null, totalAmount: { $sum: '$amount' }, totalTax: { $sum: '$taxAmount' }, count: { $sum: 1 }, netSpend: { $sum: { $add: ['$amount','$taxAmount'] } } } };
      const [totals] = await models.Expense.aggregate([{ $match: query }, group]);
      const now = new Date(); const monthQuery = { organizationId: request.user.organizationId, isDeleted: false, expenseDate: { $gte: new Date(now.getFullYear(),now.getMonth(),1), $lte: new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59,999) } };
      for (const key of ['category','status']) if (request.query[key] && request.query[key] !== 'all') monthQuery[key] = request.query[key];
      if (request.query.employeeId) monthQuery.$or = [{ purchasedBy: request.query.employeeId }, { createdBy: request.query.employeeId }];
      if (request.query.reimbursementStatus) monthQuery.reimbursementStatus = request.query.reimbursementStatus;
      const [thisMonth] = await models.Expense.aggregate([{ $match: monthQuery }, group]);
      const byCategory = await models.Expense.aggregate([{ $match: query }, { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, totalTax: { $sum: '$taxAmount' }, count: { $sum: 1 } } }, { $sort: { totalAmount: -1 } }]);
      const byVendor = await models.Expense.aggregate([{ $match: query }, { $group: { _id: { vendorKey: { $ifNull: ['$vendorKey',''] }, vendor: { $ifNull: ['$vendor',''] } }, totalAmount: { $sum: '$amount' }, totalTax: { $sum: '$taxAmount' }, count: { $sum: 1 } } }, { $project: { _id: 0, vendor: { $cond: [{ $eq: ['$_id.vendorKey',''] },'Unspecified','$_id.vendor'] }, vendorKey: '$_id.vendorKey', totalAmount: 1, totalTax: 1, count: 1, netSpend: { $add: ['$totalAmount','$totalTax'] } } }, { $sort: { netSpend: -1, vendor: 1 } }]);
      return { totals: totals || { totalAmount: 0, totalTax: 0, count: 0, netSpend: 0 }, thisMonth: thisMonth || { totalAmount: 0, totalTax: 0, count: 0, netSpend: 0 }, byCategory: byCategory.map(row => ({ category: row._id, totalAmount: row.totalAmount, totalTax: row.totalTax, count: row.count })), byVendor };
    },
    listExpenseEmployees: request => models.Employee.find({ organizationId: request.user.organizationId, isDeleted: false }).select('firstName lastName employeeCode').sort({ firstName: 1, lastName: 1 }),
    async updateExpense(request) {
      const existing = await models.Expense.findOne({ _id: request.params.id, organizationId: request.user.organizationId, isDeleted: false }); if (!existing) throw httpError(500,'Expense not found');
      const actor = await actorId(models, request); const before = existing.toObject(); pendingActive(existing,'edited');
      const hasVendor = request.body.vendorId !== undefined || request.body.vendor !== undefined;
      const vendor = hasVendor ? await resolveVendor({ organizationId: request.user.organizationId, vendorId: request.body.vendorId, vendorName: request.body.vendor }) : { vendorId: existing.vendorId || null, vendor: existing.vendor || '', vendorKey: normalizeText(existing.vendor || '') };
      const title = request.body.title !== undefined ? request.body.title : existing.title; const expenseDate = request.body.expenseDate !== undefined ? request.body.expenseDate : existing.expenseDate; const amount = request.body.amount !== undefined ? Number(request.body.amount || 0) : Number(existing.amount || 0); const taxAmount = request.body.taxAmount !== undefined ? Number(request.body.taxAmount || 0) : Number(existing.taxAmount || 0);
      if (await models.Expense.findOne(duplicateQuery({ organizationId: request.user.organizationId, title, vendor: vendor.vendor, expenseDate, amount, taxAmount, excludeId: existing._id })).select('_id')) throw httpError(500,'Duplicate expense exists for same title/vendor/date/amount');
      for (const field of ['category','title','paymentMode','reimbursementMethod']) if (request.body[field] !== undefined) existing[field] = request.body[field];
      if (request.body.purchasedBy !== undefined) existing.purchasedBy = request.body.purchasedBy || null;
      for (const field of ['reimbursementPayrollMonth','reimbursementNote','notes','receiptUrl']) if (request.body[field] !== undefined) existing[field] = request.body[field] || '';
      if (request.body.title !== undefined) existing.titleKey = normalizeText(request.body.title);
      if (hasVendor) { existing.vendorId = vendor.vendorId; existing.vendor = vendor.vendor; existing.vendorKey = vendor.vendorKey; }
      if (request.body.expenseDate !== undefined) existing.expenseDate = dayStart(request.body.expenseDate);
      if (request.body.amount !== undefined) existing.amount = Number(request.body.amount || 0);
      if (request.body.taxAmount !== undefined) existing.taxAmount = Number(request.body.taxAmount || 0);
      if (request.body.reimbursementAmount !== undefined) existing.reimbursementAmount = Number(request.body.reimbursementAmount || 0);
      if (existing.reimbursementMethod === 'payroll') { if (!existing.purchasedBy) existing.purchasedBy = actor || null; if (existing.reimbursementStatus === 'not_applicable') existing.reimbursementStatus = 'pending'; if (!Number(existing.reimbursementAmount || 0)) existing.reimbursementAmount = Number(existing.amount || 0) + Number(existing.taxAmount || 0); }
      else { existing.purchasedBy = null; existing.reimbursementStatus = 'not_applicable'; existing.reimbursementAmount = 0; existing.reimbursementPayrollMonth = ''; existing.reimbursementNote = ''; existing.reimbursedBy = null; existing.reimbursedAt = null; }
      existing.updatedBy = actor; await existing.save(); await writeAudit({ request, module:'expenses', action:'UPDATE', entityId:existing._id, before, after:existing.toObject() }); return existing;
    },
    async removeExpense(request) {
      const expense = await models.Expense.findOne({ _id:request.params.id, organizationId:request.user.organizationId }); if (!expense) throw httpError(500,'Expense not found'); pendingActive(expense,'deleted'); const actor = await actorId(models,request); expense.isDeleted = true; expense.deletedAt = new Date(); expense.deletedBy = actor; await expense.save(); await writeAudit({ request,module:'expenses',action:'DELETE',entityId:expense._id,before:expense.toObject() }); return expense;
    },
    async restoreExpense(request) {
      const expense = await models.Expense.findOne({ _id:request.params.id, organizationId:request.user.organizationId }); if (!expense) throw httpError(500,'Expense not found'); if (!expense.isDeleted) throw httpError(500,'Expense is not deleted'); const actor = await actorId(models,request); const before = expense.toObject();
      if (await models.Expense.findOne(duplicateQuery({ organizationId:request.user.organizationId,title:expense.title,vendor:expense.vendor,expenseDate:expense.expenseDate,amount:expense.amount,taxAmount:expense.taxAmount,excludeId:expense._id })).select('_id')) throw httpError(500,'Cannot restore due to active duplicate expense');
      expense.isDeleted = false; expense.deletedAt = null; expense.deletedBy = null; expense.restoredAt = new Date(); expense.restoredBy = actor; await expense.save(); await writeAudit({ request,module:'expenses',action:'RESTORE',entityId:expense._id,before,after:expense.toObject() }); return expense;
    },
    async actionExpense(request) {
      const expense = await models.Expense.findOne({ _id:request.params.id,organizationId:request.user.organizationId,isDeleted:false }); if (!expense) throw httpError(500,'Expense not found'); pendingActive(expense,'actioned'); const actor = await actorId(models,request); const before = expense.toObject(); const next = applyAction({ expense:expense.toObject(),status:request.body.status,rejectionReason:request.body.rejectionReason,actorEmployeeId:actor });
      for (const key of ['status','rejectionReason','actionBy','actionAt','updatedBy']) expense[key] = next[key]; await expense.save(); await writeAudit({ request,module:'expenses',action:'ACTION',entityId:expense._id,before,after:expense.toObject() }); return expense;
    },
    async updateReimbursement(request) {
      const expense = await models.Expense.findOne({ _id:request.params.id,organizationId:request.user.organizationId,isDeleted:false }); if (!expense) throw httpError(500,'Expense not found'); if (expense.reimbursementMethod !== 'payroll') throw httpError(500,'This expense is not marked for payroll reimbursement'); if (!expense.purchasedBy) throw httpError(500,'Purchased by employee is required');
      const actor = await actorId(models,request); const before = expense.toObject(); expense.reimbursementStatus = request.body.reimbursementStatus; if (request.body.reimbursementPayrollMonth !== undefined) expense.reimbursementPayrollMonth = request.body.reimbursementPayrollMonth || ''; if (request.body.reimbursementNote !== undefined) expense.reimbursementNote = request.body.reimbursementNote || ''; if (request.body.reimbursementStatus === 'paid') { expense.reimbursedBy = actor; expense.reimbursedAt = new Date(); } expense.updatedBy = actor; await expense.save(); await writeAudit({ request,module:'expenses',action:'REIMBURSEMENT_UPDATE',entityId:expense._id,before,after:expense.toObject() }); return expense;
    },
    async uploadReceipt(request) {
      const parsed = parseReceiptInput(request.body || {}); const uniqueName = `${Date.now()}-${Math.round(Math.random()*1e9)}`; const folder = `rigweda/${request.user.organizationId}/expenses/receipts`;
      const uploaded = await uploadDataUri(parsed.dataUri,{ folder,public_id:`receipt-${uniqueName}`,resource_type:parsed.extension === '.pdf' ? 'raw' : 'image' }); return { fileName:uploaded?.public_id || `receipt-${uniqueName}`,receiptUrl:uploaded?.secure_url || '' };
    },
    listVendors: request => models.ExpenseVendor.find({ organizationId:request.user.organizationId }).populate('createdBy','firstName lastName employeeCode').populate('updatedBy','firstName lastName employeeCode').sort({ isActive:-1,name:1 }),
    async createVendor(request) {
      const actor = await actorId(models,request); const name = String(request.body.name || '').trim(); const nameKey = normalizeText(name); if (await models.ExpenseVendor.findOne({ organizationId:request.user.organizationId,nameKey }).select('_id')) throw httpError(500,'Vendor with same name already exists');
      const vendor = await models.ExpenseVendor.create({ organizationId:request.user.organizationId,name,nameKey,isActive:request.body.isActive !== undefined ? Boolean(request.body.isActive) : true,createdBy:actor,updatedBy:actor }); await writeAudit({ request,module:'expense_vendors',action:'CREATE',entityId:vendor._id,after:vendor.toObject() }); return vendor;
    },
    async updateVendor(request) {
      const vendor = await models.ExpenseVendor.findOne({ _id:request.params.vendorId,organizationId:request.user.organizationId }); if (!vendor) throw httpError(500,'Vendor not found'); const actor = await actorId(models,request); const before = vendor.toObject(); const name = request.body.name !== undefined ? String(request.body.name || '').trim() : vendor.name; const nameKey = normalizeText(name); if (!name) throw httpError(500,'Vendor name is required');
      if (await models.ExpenseVendor.findOne({ organizationId:request.user.organizationId,nameKey,_id:{ $ne:vendor._id } }).select('_id')) throw httpError(500,'Vendor with same name already exists'); vendor.name = name; vendor.nameKey = nameKey; if (request.body.isActive !== undefined) vendor.isActive = Boolean(request.body.isActive); vendor.updatedBy = actor; await vendor.save();
      if (before.name !== vendor.name) await models.Expense.updateMany({ organizationId:request.user.organizationId,vendorId:vendor._id },{ $set:{ vendor:vendor.name,vendorKey:vendor.nameKey } }); await writeAudit({ request,module:'expense_vendors',action:'UPDATE',entityId:vendor._id,before,after:vendor.toObject() }); return vendor;
    },
    async removeVendor(request) {
      const vendor = await models.ExpenseVendor.findOne({ _id:request.params.vendorId,organizationId:request.user.organizationId }); if (!vendor) throw httpError(500,'Vendor not found'); const active = await models.Expense.findOne({ organizationId:request.user.organizationId,isDeleted:false,$or:[{ vendorId:vendor._id },{ vendorKey:vendor.nameKey }] }).select('_id'); if (active) throw httpError(500,'Vendor is used in expenses and cannot be deleted'); await vendor.deleteOne(); await writeAudit({ request,module:'expense_vendors',action:'DELETE',entityId:vendor._id,before:vendor.toObject() }); return { _id:vendor._id };
    },
  };
  return service;
};
