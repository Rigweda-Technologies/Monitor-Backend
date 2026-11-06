import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createProjectModels } from '../src/modules/projects/project.models.js';
import { createProjectService } from '../src/modules/projects/project.service.js';

const uri = process.env.V2_HRMS_ISOLATED_TEST_DATABASE_URL;
test('project persistence scopes records, audits mutations, stores uploads and soft-deletes', { skip: !uri }, async t => {
  assert.match(new URL(uri).pathname, /[_-](test|isolated|ci)([_-]|$)/i);
  const connection = await mongoose.createConnection(uri, { autoCreate: false, autoIndex: false }).asPromise();
  const models = createProjectModels(connection);
  const organizationId = new mongoose.Types.ObjectId();
  const otherOrganizationId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const employee = await models.Employee.create({ organizationId, firstName: 'Ada', lastName: 'Lovelace', employeeCode: 'E-1', status: 'active' });
  t.after(async () => {
    await Promise.all([models.Project.deleteMany({ organizationId }), models.Employee.deleteMany({ organizationId }), models.AuditLog.deleteMany({ organizationId })]);
    await connection.close();
  });
  const uploads = [];
  const service = createProjectService(models, { uploadDataUri: async (...args) => { uploads.push(args); return { secure_url: `https://files.example/${uploads.length}` }; } });
  const request = { user: { userId, organizationId }, body: { projectName: '  Website  ', clientName: 'Client Name', actualAmount: 100, discountedAmount: 90, paidAmount: 25, paidTo: String(employee._id), mouUpload: { fileName: 'agreement.pdf', mimeType: 'application/pdf', base64Data: 'eA==' } }, query: {}, params: {}, ip: '127.0.0.1', headers: { 'user-agent': 'project-test' } };
  const created = await service.create(request);
  assert.equal(created.projectNameKey, 'website');
  assert.equal(created.pendingAmount, 65);
  assert.equal(created.mouFile.fileUrl, 'https://files.example/1');
  assert.deepEqual(uploads[0], ['data:application/pdf;base64,eA==', { folder: 'hrms/project-mou-files', resource_type: 'raw' }]);
  assert.equal(await models.AuditLog.countDocuments({ organizationId, module: 'projects', action: 'CREATE' }), 1);
  const list = await service.list(request);
  assert.equal(list.length, 1);
  assert.equal(String(list[0].paidTo._id), String(employee._id));
  request.params = { id: String(created._id) };
  assert.equal((await service.getById(request)).projectName, 'Website');
  request.body = { paidAmount: 40, notes: 'updated' };
  const updated = await service.update(request);
  assert.equal(updated.pendingAmount, 50);
  assert.equal((await models.AuditLog.countDocuments({ organizationId, module: 'projects', action: 'UPDATE' })), 1);
  await assert.rejects(service.getById({ ...request, user: { userId, organizationId: otherOrganizationId } }), /Project not found/);
  await service.remove(request);
  assert.equal((await service.list(request)).length, 0);
  assert.equal((await models.Project.collection.findOne({ _id: created._id }))?.isDeleted, true);
  assert.equal((await models.AuditLog.countDocuments({ organizationId, module: 'projects', action: 'DELETE' })), 1);
});

test('project model uses existing collections and defers index/create ownership', async t => {
  const connection = mongoose.createConnection();
  t.after(() => connection.close());
  const models = createProjectModels(connection);
  assert.equal(models.Project.collection.collectionName, 'projects');
  assert.equal(models.Employee.collection.collectionName, 'employees');
  assert.equal(models.AuditLog.collection.collectionName, 'audit_logs');
  assert.equal(models.Project.schema.options.autoCreate, false);
  assert.equal(models.Project.schema.options.autoIndex, false);
  assert.equal(models.Project.schema.indexes().some(([keys]) => keys.projectNameKey === 1), true);
});
