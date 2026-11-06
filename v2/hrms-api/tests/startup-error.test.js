import test from 'node:test';
import assert from 'node:assert/strict';
import { startupFailureMessage } from '../src/config/startup-error.js';

test('startup diagnostics show known configuration errors without exposing values', () => {
  assert.equal(startupFailureMessage(new Error('MONGODB_URI is required.')), 'HRMS v2 startup failed: MONGODB_URI is required.');
  assert.equal(startupFailureMessage(new Error('JWT_SECRET is required.')), 'HRMS v2 startup failed: JWT_SECRET is required.');
  const diagnostic = startupFailureMessage(Object.assign(new Error('failed to connect mongodb://user:password@host/db'), { name:'MongooseServerSelectionError' }));
  assert.match(diagnostic, /MongoDB is unreachable/);
  assert.ok(!diagnostic.includes('password'));
  assert.equal(startupFailureMessage(Object.assign(new Error('connection failed'), { name:'PrismaClientInitializationError' })), 'HRMS v2 startup failed: a configured PostgreSQL database is unavailable or misconfigured. Check the enabled database URLs and availability.');
  assert.match(startupFailureMessage(Object.assign(new Error('address already in use'), { code:'EADDRINUSE' })), /PORT or stop the process/);
});
