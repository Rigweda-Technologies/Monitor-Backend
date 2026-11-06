import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createModels } from '../src/modules/auth/auth.models.js';
import { createOrganizationSeeder } from '../src/modules/roles/organization-seeder.js';
import { createRoleSeedCommand } from '../src/modules/roles/role-seed-command.js';

dotenv.config({ path:fileURLToPath(new URL('../.env', import.meta.url)), quiet:true });

const args=process.argv.slice(2);
const apply=args.includes('--apply');
const organizationArgs=args.filter(value=>value.startsWith('--organization='));
const organizationArg=organizationArgs[0];
const unknown=args.filter(value=>value!=='--apply'&&!value.startsWith('--organization='));
let connection;
try {
  if (unknown.length || organizationArgs.length>1) throw new Error('Usage: npm run seed:organization-roles [-- --apply] [--organization=<24-hex-id>]');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const organizationId=organizationArg?.slice('--organization='.length);
  if (organizationId&&!/^[a-f0-9]{24}$/i.test(organizationId)) throw new Error('organizationId must be a valid MongoDB ObjectId.');
  connection=mongoose.createConnection(process.env.MONGODB_URI,{autoCreate:false,autoIndex:false,serverSelectionTimeoutMS:10000,connectTimeoutMS:10000,bufferCommands:false});
  await connection.asPromise();
  const models=createModels(connection);
  const run=createRoleSeedCommand({Organization:models.Organization,seedOrganizationRoles:createOrganizationSeeder({Role:models.Role,Permission:models.Permission})});
  const result=await run({apply,organizationId});
  console.log(result.dryRun?`Dry run: ${result.matched} non-SYSTEM organization(s) match. Pass --apply to seed.`:`Seeded roles and permissions for ${result.seeded} organization(s).`);
} catch (error) {
  const safeMessage=/^(Usage:|MONGODB_URI is required\.|organizationId must be a valid MongoDB ObjectId\.)/.test(error.message||'')?error.message:'Role seeding failed. Check MongoDB availability and existing indexes.';
  console.error(safeMessage);
  process.exitCode=1;
} finally {
  await connection?.close().catch(()=>{});
}
