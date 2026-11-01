import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createOrgSettingsModels } from '../src/modules/org-settings/org-settings.models.js';

test('organization settings model maps to the existing org_settings collection without creating it', async t => {
  const connection = mongoose.createConnection();
  t.after(() => connection.close());
  const { OrgSettings } = createOrgSettingsModels(connection);
  assert.equal(OrgSettings.collection.collectionName, 'org_settings');
  assert.equal(OrgSettings.schema.options.autoCreate, false);
  assert.equal(OrgSettings.schema.options.autoIndex, false);
  assert.equal(OrgSettings.schema.path('organizationId').options.unique, true);
  assert.equal(OrgSettings.schema.path('attendanceGeoLatitude').defaultValue, null);
});
