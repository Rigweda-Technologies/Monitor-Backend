import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import mongoose from 'mongoose';
import swagger from '@fastify/swagger';
import { createExpenseModels } from '../src/modules/expenses/expense.models.js';
import { createExpenseService } from '../src/modules/expenses/expense.service.js';
import { registerExpenseRoutes } from '../src/modules/expenses/expense.routes.js';

const setup = async () => {
  const permissions = [];
  const operations = [];
  const service = Object.fromEntries(['createExpense','listExpenses','getSummary','listExpenseEmployees','uploadReceipt','listVendors','createVendor','updateVendor','removeVendor','updateExpense','removeExpense','actionExpense','updateReimbursement','restoreExpense'].map(name => [name, async request => { operations.push({ name, request }); return { operation: name }; }]));
  const app = Fastify({ logger: false });
  await app.register(swagger, { openapi: { info: { title: 'test', version: '1' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } } } });
  await registerExpenseRoutes(app, { service, authenticate: async request => { request.user = { userId: 'user-1', organizationId: 'org-1' }; }, authorize: async permission => { permissions.push(permission); return null; } });
  await app.ready();
  return { app, permissions, operations };
};

test('all 14 expense routes are mounted, documented, permission guarded, and return v1 envelopes', async t => {
  const { app, permissions, operations } = await setup();
  t.after(() => app.close());
  const routes = [
    ['POST','/api/v2/expenses/','EXPENSE_MANAGE',{ category:'other', title:'Fuel', expenseDate:'2026-01-01', amount:4 },201,'Expense created'],
    ['GET','/api/v2/expenses/','EXPENSE_VIEW',{ },200,'Success'],
    ['GET','/api/v2/expenses/summary','EXPENSE_VIEW',{ },200,'Success'],
    ['GET','/api/v2/expenses/employees','EXPENSE_VIEW',{ },200,'Success'],
    ['POST','/api/v2/expenses/upload-receipt','EXPENSE_MANAGE',{ fileName:'receipt.png', fileData:'data:image/png;base64,aGVsbG8=' },200,'Receipt uploaded'],
    ['GET','/api/v2/expenses/vendors','EXPENSE_VIEW',{ },200,'Success'],
    ['POST','/api/v2/expenses/vendors','EXPENSE_MANAGE',{ name:'Vendor Co' },201,'Vendor created'],
    ['PUT','/api/v2/expenses/vendors/vendor-1','EXPENSE_MANAGE',{ name:'Vendor Co' },200,'Vendor updated'],
    ['DELETE','/api/v2/expenses/vendors/vendor-1','EXPENSE_MANAGE',{ },200,'Vendor deleted'],
    ['PUT','/api/v2/expenses/expense-1','EXPENSE_MANAGE',{ title:'Fuel' },200,'Expense updated'],
    ['DELETE','/api/v2/expenses/expense-1','EXPENSE_MANAGE',{ },200,'Expense deleted'],
    ['PUT','/api/v2/expenses/expense-1/action','EXPENSE_ACTION',{ status:'approved' },200,'Expense approved'],
    ['PUT','/api/v2/expenses/expense-1/reimbursement','EXPENSE_MANAGE',{ reimbursementStatus:'paid' },200,'Reimbursement updated'],
    ['PUT','/api/v2/expenses/expense-1/restore','EXPENSE_MANAGE',{ },200,'Expense restored'],
  ];
  for (const [method,url] of routes) {
    const routeUrl = url.replace('vendor-1', ':vendorId').replace('expense-1', ':id');
    assert.ok(app.hasRoute({ method, url:routeUrl }), `missing ${method} ${routeUrl}`);
  }
  for (const [method,url,permission,payload,status,message] of routes) {
    const response = await app.inject({ method, url, ...(method === 'GET' ? {} : { payload }), headers: { authorization:'Bearer test' } });
    assert.equal(response.statusCode, status, `${method} ${url}`);
    assert.equal(response.json().success, true);
    assert.equal(response.json().message, message);
  }
  assert.deepEqual(permissions, routes.map(([, , permission]) => permission === 'EXPENSE_VIEW' ? ['EXPENSE_VIEW','EXPENSE_MANAGE'] : permission));
  assert.equal(operations.length, 14);
  for (const [path, methods] of Object.entries(app.swagger().paths)) for (const method of Object.keys(methods)) assert.ok(methods[method].responses['200'] || methods[method].responses['201'], `${method} ${path} lacks documented success response`);
});

test('expense request validation matches legacy 406 validation envelope', async t => {
  const { app } = await setup();
  t.after(() => app.close());
  const response = await app.inject({ method:'POST', url:'/api/v2/expenses/', headers:{ authorization:'Bearer test' }, payload:{ title:'x' } });
  assert.equal(response.statusCode,406);
  assert.equal(response.json().code,406);
  assert.deepEqual(response.json().error,[]);
});

test('expense models preserve legacy collection names and indexes', async () => {
  const connection = mongoose.createConnection();
  try {
    const models = createExpenseModels(connection);
    assert.equal(models.Expense.collection.collectionName,'expenses');
    assert.equal(models.ExpenseVendor.collection.collectionName,'expense_vendors');
    assert.ok(models.Expense.schema.indexes().some(([keys]) => keys.organizationId === 1 && keys.expenseDate === -1));
    assert.ok(models.ExpenseVendor.schema.indexes().some(([keys,options]) => keys.organizationId === 1 && keys.nameKey === 1 && options.unique));
  } finally { await connection.close(); }
});

test('expense create preserves tenant/default ownership and writes injected audit', async () => {
  const calls = { query:null, created:null, audit:null };
  const expense = { _id:'expense-id', toObject:() => ({ _id:'expense-id',...calls.created }) };
  const models = {
    Employee:{ findOne:() => ({ select:async () => ({ _id:'employee-id' }) }) },
    ExpenseVendor:{ findOne:() => ({ select:async () => null }) },
    Expense:{ findOne:query => { calls.query=query; return { select:async () => null }; }, create:async payload => { calls.created=payload; return expense; } },
  };
  const service = createExpenseService(models,{ audit:async event => { calls.audit=event; } });
  const result = await service.createExpense({ user:{ userId:'user-id',organizationId:'org-id' },body:{ category:'travel',title:' Taxi ',expenseDate:'2026-01-02T17:00:00.000Z',amount:'25' },headers:{},ip:'127.0.0.1' });
  assert.equal(result,expense);
  assert.equal(calls.created.organizationId,'org-id');
  assert.equal(calls.created.createdBy,'employee-id');
  assert.equal(calls.created.titleKey,'taxi');
  assert.equal(calls.created.reimbursementMethod,'none');
  assert.equal(calls.created.reimbursementStatus,'not_applicable');
  assert.equal(calls.query.organizationId,'org-id');
  assert.deepEqual(calls.audit,{ req:{ user:{ userId:'user-id',organizationId:'org-id' },body:{ category:'travel',title:' Taxi ',expenseDate:'2026-01-02T17:00:00.000Z',amount:'25' },headers:{},ip:'127.0.0.1' },module:'expenses',action:'CREATE',entityId:'expense-id',before:undefined,after:{ _id:'expense-id',...calls.created } });
});

test('receipt upload sends validated normalized data through the injected provider', async () => {
  let upload;
  const service = createExpenseService({}, { uploadDataUri:async (data,options) => { upload={data,options}; return {public_id:'receipt-id',secure_url:'https://provider.invalid/receipt'}; } });
  const result = await service.uploadReceipt({ user:{organizationId:'org-id'},body:{fileName:'bill.pdf',fileData:'aGVsbG8gd29ybGQ='} });
  assert.equal(result.fileName,'receipt-id');
  assert.equal(result.receiptUrl,'https://provider.invalid/receipt');
  assert.equal(upload.data,'data:application/pdf;base64,aGVsbG8gd29ybGQ=');
  assert.equal(upload.options.folder,'rigweda/org-id/expenses/receipts');
  assert.equal(upload.options.resource_type,'raw');
});
