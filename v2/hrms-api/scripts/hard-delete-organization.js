import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config/env.js';
import { createRuntime } from '../src/runtime.js';
import { createHardDeleteCommand } from '../src/modules/organizations/hard-delete-command.js';

dotenv.config({ path:fileURLToPath(new URL('../.env', import.meta.url)), quiet:true });

const args=process.argv.slice(2);
const orgArgs=args.filter(value=>value.startsWith('--org='));
const actorArgs=args.filter(value=>value.startsWith('--actor='));
const confirmArgs=args.filter(value=>value.startsWith('--confirm='));
const orgId=orgArgs[0]?.slice('--org='.length)||'';
const actorUserId=actorArgs[0]?.slice('--actor='.length)||'';
const confirmationCode=confirmArgs[0]?.slice('--confirm='.length)||'';
const dryRun=args.includes('--dry-run');
const yes=args.includes('--yes');
const allowed=new Set(['--dry-run','--yes',...orgArgs,...actorArgs,...confirmArgs]);
const unknown=args.filter(value=>!allowed.has(value));
const reportDirectory=fileURLToPath(new URL('../reports/org-hard-delete/',import.meta.url));
const safeCode=value=>String(value||'org').trim().replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'org';

let runtime;
try {
  if(unknown.length||orgArgs.length!==1||actorArgs.length>1||confirmArgs.length>1)throw new Error('Usage: npm run org:hard-delete -- --dry-run --org=<id> | npm run org:hard-delete -- --org=<id> --actor=<superadmin-id> --confirm=<ORG_CODE> --yes');
  if(!mongoose.Types.ObjectId.isValid(orgId))throw new Error('Provide a valid --org=<organizationId>.');
  if(dryRun&&(yes||actorUserId||confirmationCode))throw new Error('Dry run does not accept --actor, --confirm, or --yes.');
  if(!dryRun&&(!mongoose.Types.ObjectId.isValid(actorUserId)||!confirmationCode||!yes))throw new Error('Execution requires valid --actor, --confirm=<ORG_CODE>, and --yes.');

  const env={...process.env,MONITOR_DATABASE_URL:'',MONITOR_TOOL_DATABASE_URL:'',DESKTOP_MONITOR_DATABASE_URL:'',MONITOR_PGHOST:''};
  const config=loadConfig(env);
  runtime=await createRuntime({config,logger:false});
  const command=createHardDeleteCommand({
    models:runtime.organizationModels,
    payrollRepository:runtime.payrollRepository,
    hardDelete:input=>runtime.organizationService.lifecycleAction(input),
  });
  const report=await command({organizationId:orgId,actorUserId,confirmationCode,execute:!dryRun});
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const reportPath=path.join(reportDirectory,`${stamp}-${safeCode(report.beforeSummary.organization.code)}-${report.mode}.json`);
  await fs.mkdir(reportDirectory,{recursive:true});
  const generatedAt=new Date().toISOString();
  await fs.writeFile(reportPath,`${JSON.stringify({...report,generatedAt,...(!dryRun?{executedAt:generatedAt}:{})},null,2)}\n`,'utf8');
  if(dryRun){
    console.log('Hard Delete Dry Run');
    console.log(`Organization: ${report.beforeSummary.organization.name} (${report.beforeSummary.organization.code})`);
    console.log(`Status: ${report.beforeSummary.organization.status}${report.beforeSummary.organization.isSoftDeleted?' / deleted':''}`);
    console.log(`Mongo rows: ${report.beforeSummary.collectionCounts.reduce((sum,item)=>sum+item.count,0)}; linked users: ${report.beforeSummary.linkedUsers}; sole-org users: ${report.beforeSummary.orphanUsers}; shared users: ${report.beforeSummary.multiOrgUsers}; memberships: ${report.beforeSummary.membershipCount}; payroll tenants: ${report.beforeSummary.payrollTenantCount}`);
    for(const item of report.beforeSummary.collectionCounts)console.log(`  ${item.collectionName}: ${item.count}`);
  }else{
    console.log('Organization hard delete completed.');
    console.log(JSON.stringify(report.result,null,2));
  }
  console.log(`Report written: ${reportPath}`);
}catch(error){
  const safeMessage=/^(Usage:|Provide a valid --org=|Dry run does not accept|Execution requires|MONGODB_URI is required\.|JWT_SECRET is required\.)/.test(error.message||'')?error.message:'Organization hard delete failed. Check configured database availability and review the V2 service logs.';
  console.error(safeMessage);
  process.exitCode=1;
}finally{
  await runtime?.close().catch(()=>{});
}
