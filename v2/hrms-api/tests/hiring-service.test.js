import test from 'node:test';
import assert from 'node:assert/strict';
import { createHiringService } from '../src/modules/hiring/hiring.service.js';

const queryResult = value => ({ select: async () => value });
const makeReq = (body = {}, params = {}) => ({ user: { userId: 'actor', organizationId: 'org' }, body, params, query: {}, headers: { 'user-agent': 'unit-test' }, ip: '127.0.0.1' });

test('candidate creation normalizes email and skills and derives talent-pool status for rejected future consideration', async () => {
  let created; let audited;
  const candidate = { _id: 'candidate', toObject() { return { ...created }; } };
  const models = {
    HiringJob: { findOne: () => queryResult({ _id: 'job', status: 'open' }) },
    HiringCandidate: { findOne: () => queryResult(null), create: async payload => { created = payload; return candidate; } },
    Employee: {}, AuditLog: { create: async value => { audited = value; } }, Organization: {},
  };
  const service = createHiringService(models);
  await service.createCandidate(makeReq({ jobId: 'job', firstName: 'Rae', email: '  RAE@EXAMPLE.COM ', stage: 'rejected', keySkills: [' JS ', '', 'Node'.repeat(20)] }));
  assert.equal(created.email, 'rae@example.com');
  assert.equal(created.status, 'talent_pool');
  assert.deepEqual(created.keySkills, ['JS', 'Node'.repeat(20)]);
  assert.deepEqual(created.stageTimeline[0], { stage: 'rejected', changedBy: 'actor', note: 'Initial stage' });
  assert.equal(audited.action, 'CANDIDATE_CREATE');
});

test('offer email uses injected SMTP function before recording/auditing release', async () => {
  const events = [];
  const row = { _id: 'candidate', email: 'person@example.com', firstName: 'Ada', lastName: 'Lovelace', expectedCTC: 1200000, stage: 'offer', stageTimeline: [], toObject() { return { stage: this.stage, offerLetterReleasedAt: this.offerLetterReleasedAt }; }, async save() { events.push('save'); } };
  const models = { HiringCandidate: { findOne: async () => row }, HiringJob: { findById: () => ({ select: async () => ({ title: 'Engineer', location: 'Remote', employmentType: 'full_time' }) }) }, Organization: { findById: () => ({ select: async () => ({ name: 'Rigweda' }) }) }, AuditLog: { create: async () => events.push('audit') }, Employee: {} };
  const service = createHiringService(models, { sendMail: async (...args) => { events.push(['mail', ...args]); return true; }, config: { hrContactEmail: 'hr@example.com', frontendLoginUrl: 'https://portal.example' } });
  await service.releaseOfferLetter(makeReq({ note: 'Approved' }, { id: 'candidate' }));
  const mail = events.find(Array.isArray);
  assert.equal(mail[1], 'offerLetter');
  assert.equal(mail[2], 'Ada Lovelace');
  assert.equal(mail[3], 'Offer Letter - Engineer');
  assert.equal(mail[4].expectedCTC, 'INR 12,00,000 per annum');
  assert.equal(mail[4].hrEmail, 'hr@example.com');
  assert.equal(events.at(-2), 'save');
  assert.equal(events.at(-1), 'audit');
});

test('hired-candidate conversion rejects a second conversion before invoking employee provider', async () => {
  let providerCalled = false;
  const row = { _id: 'c', stage: 'hired', convertedToEmployeeId: 'employee', toObject: () => ({}) };
  const models = { HiringCandidate: { findOne: async () => row }, Employee: {}, HiringJob: {}, Organization: {}, AuditLog: {} };
  const service = createHiringService(models, { createOrgUser: async () => { providerCalled = true; } });
  await assert.rejects(service.convertCandidateToEmployee(makeReq({}, { id: 'c' })), /Candidate is already converted to employee/);
  assert.equal(providerCalled, false);
});
