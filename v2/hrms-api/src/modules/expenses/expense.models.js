import mongoose from 'mongoose';
import { createEmployeeModels } from '../employees/employee.models.js';

export const createExpenseModels = connection => {
  const { Employee } = createEmployeeModels(connection);
  const objectId = mongoose.Schema.Types.ObjectId;
  const expenseSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true },
    category: { type: String, enum: ['assets','office_rent','utilities','software','travel','maintenance','salary','marketing','other'], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 }, titleKey: { type: String, required: true, lowercase: true, trim: true, index: true },
    vendor: { type: String, default: '', trim: true, maxlength: 120 }, vendorId: { type: objectId, ref: 'expense_vendors', default: null, index: true }, vendorKey: { type: String, default: '', lowercase: true, trim: true, index: true },
    expenseDate: { type: Date, required: true, index: true }, amount: { type: Number, required: true, min: 0 }, taxAmount: { type: Number, default: 0, min: 0 },
    paymentMode: { type: String, enum: ['cash','bank_transfer','card','upi','cheque','other'], default: 'bank_transfer' }, reimbursementMethod: { type: String, enum: ['none','payroll'], default: 'none', index: true },
    purchasedBy: { type: objectId, ref: 'employees', default: null, index: true }, reimbursementStatus: { type: String, enum: ['not_applicable','pending','queued','paid'], default: 'not_applicable', index: true },
    reimbursementAmount: { type: Number, default: 0, min: 0 }, reimbursementPayrollMonth: { type: String, default: '', trim: true }, reimbursementNote: { type: String, default: '', trim: true, maxlength: 500 },
    reimbursedBy: { type: objectId, ref: 'employees', default: null }, reimbursedAt: { type: Date, default: null }, notes: { type: String, default: '', trim: true, maxlength: 1000 }, receiptUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true }, rejectionReason: { type: String, default: '', trim: true, maxlength: 500 }, actionBy: { type: objectId, ref: 'employees', default: null }, actionAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true }, deletedAt: { type: Date, default: null }, deletedBy: { type: objectId, ref: 'employees', default: null }, restoredAt: { type: Date, default: null }, restoredBy: { type: objectId, ref: 'employees', default: null }, createdBy: { type: objectId, ref: 'employees', default: null }, updatedBy: { type: objectId, ref: 'employees', default: null },
  }, { timestamps: true, collection: 'expenses', autoCreate: false, autoIndex: false });
  expenseSchema.index({ organizationId: 1, expenseDate: -1 });
  expenseSchema.index({ organizationId: 1, category: 1, expenseDate: -1 });
  expenseSchema.index({ organizationId: 1, isDeleted: 1, titleKey: 1, vendorKey: 1, expenseDate: 1, amount: 1, taxAmount: 1 });
  const vendorSchema = new mongoose.Schema({
    organizationId: { type: objectId, ref: 'organizations', required: true, index: true }, name: { type: String, required: true, trim: true, maxlength: 120 }, nameKey: { type: String, required: true, trim: true, lowercase: true, index: true }, isActive: { type: Boolean, default: true, index: true }, createdBy: { type: objectId, ref: 'employees', default: null }, updatedBy: { type: objectId, ref: 'employees', default: null },
  }, { timestamps: true, collection: 'expense_vendors', autoCreate: false, autoIndex: false });
  vendorSchema.index({ organizationId: 1, nameKey: 1 }, { unique: true });
  const auditSchema = new mongoose.Schema({ organizationId: objectId, userId: objectId, module: String, action: String, entityId: objectId, before: mongoose.Schema.Types.Mixed, after: mongoose.Schema.Types.Mixed, ipAddress: String, userAgent: String }, { timestamps: true, collection: 'audit_logs', autoCreate: false, autoIndex: false });
  const get = (name, schema, collection) => connection.models[name] || connection.model(name, schema, collection);
  return { Expense: get('expenses', expenseSchema, 'expenses'), ExpenseVendor: get('expense_vendors', vendorSchema, 'expense_vendors'), Employee, AuditLog: get('audit_logs', auditSchema, 'audit_logs') };
};
