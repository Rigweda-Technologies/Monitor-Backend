import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createPasswords } from '../src/integrations/passwords.js';
import { createSystemBootstrapService } from '../src/modules/organizations/system-bootstrap.service.js';

dotenv.config({ path:fileURLToPath(new URL('../.env', import.meta.url)), quiet:true });

const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const safeServiceMessage = message => /^(HRMS_BOOTSTRAP_(EMAIL|PASSWORD).+|Bootstrap email is already registered; refusing to grant SYSTEM access\.)$/.test(message || '');

let connection;
try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  if (!process.env.HRMS_BOOTSTRAP_EMAIL) throw new Error('HRMS_BOOTSTRAP_EMAIL is required.');
  if (!process.env.HRMS_BOOTSTRAP_PASSWORD) throw new Error('HRMS_BOOTSTRAP_PASSWORD is required.');
  if (!Number.isInteger(rounds) || rounds < 4 || rounds > 16) throw new Error('BCRYPT_SALT_ROUNDS must be an integer between 4 and 16.');

  connection = mongoose.createConnection(process.env.MONGODB_URI, {
    autoCreate:false, autoIndex:false, serverSelectionTimeoutMS:10000, connectTimeoutMS:10000, bufferCommands:false,
  });
  await connection.asPromise();
  const bootstrap = createSystemBootstrapService({ models:createModels(connection), hashPassword:createPasswords(rounds).hashPassword });
  const result = await bootstrap({ email:process.env.HRMS_BOOTSTRAP_EMAIL, password:process.env.HRMS_BOOTSTRAP_PASSWORD });
  console.log(result.created ? `SYSTEM bootstrap created (${result.systemOrgId}).` : `SYSTEM bootstrap already exists (${result.systemOrgId}).`);
} catch (error) {
  const message = error.message === 'MONGODB_URI is required.' || error.message === 'HRMS_BOOTSTRAP_EMAIL is required.' || error.message === 'HRMS_BOOTSTRAP_PASSWORD is required.' || error.message === 'BCRYPT_SALT_ROUNDS must be an integer between 4 and 16.' || safeServiceMessage(error.message)
    ? error.message
    : 'SYSTEM bootstrap failed. Check MongoDB availability and required existing indexes.';
  console.error(`SYSTEM bootstrap failed: ${message}`);
  process.exitCode = 1;
} finally {
  await connection?.close().catch(() => {});
}
