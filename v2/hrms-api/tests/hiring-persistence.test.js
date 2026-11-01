import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createHiringModels } from '../src/modules/hiring/hiring.models.js';

test('hiring models map to existing Mongo collections and retain unique tenant indexes', async t => {
  const connection = mongoose.createConnection();
  t.after(() => connection.close());
  const models = createHiringModels(connection);
  assert.equal(models.HiringJob.collection.collectionName, 'hiring_jobs');
  assert.equal(models.HiringCandidate.collection.collectionName, 'hiring_candidates');
  assert.equal(models.Employee.collection.collectionName, 'employees');
  assert.equal(models.Organization.collection.collectionName, 'organizations');
  assert.equal(models.AuditLog.collection.collectionName, 'audit_logs');
  assert.equal(models.HiringJob.schema.options.autoCreate, false);
  assert.equal(models.HiringCandidate.schema.options.autoIndex, false);
  assert.ok(models.HiringJob.schema.indexes().some(([keys, options]) => keys.organizationId === 1 && keys.titleKey === 1 && options.unique));
  assert.ok(models.HiringCandidate.schema.indexes().some(([keys, options]) => keys.organizationId === 1 && keys.jobId === 1 && keys.email === 1 && options.unique));
});
