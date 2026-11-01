import gzip
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'deploy.sh'
REVISION = 'b' * 40
IMAGE = f'hrms-api-v2:{REVISION}'
MOCK = '''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
state_path=Path(os.environ['MOCK_STATE']);state=json.loads(state_path.read_text());args=sys.argv[1:];cmd=Path(sys.argv[0]).name;code=0
if cmd in ['sleep','flock']: pass
elif cmd=='curl': code=1 if os.environ.get('FAIL_HEALTH')=='1' and state.get('hrms-api-v2')=='new' else 0
elif cmd=='docker':
 op=args[0]
 if op=='image' and args[1:3]==['inspect','--format']: print('b'*40)
 elif op=='image': pass
 elif op=='inspect':
  if args[-1] not in state: code=1
 elif op=='rm': state.pop(args[-1],None)
 elif op=='stop': pass
 elif op=='rename': state[args[2]]=state.pop(args[1])
 elif op=='start': pass
 elif op=='run': state[args[args.index('--name')+1]]='new';code=1 if os.environ.get('FAIL_RUN')=='1' else 0
 else: raise Exception(args)
tmp=state_path.with_name(state_path.name+'.tmp');tmp.write_text(json.dumps(state));tmp.replace(state_path);sys.exit(code)
'''

class DeploymentTests(unittest.TestCase):
    def run_deploy(self, state=None, image=IMAGE, **overrides):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            for command in ['docker','curl','sleep','flock']:
                binary=root/command;binary.write_text(MOCK);binary.chmod(0o755)
            state_path=root/'state.json';state_path.write_text(json.dumps(state or {}))
            env_file=root/'runtime.env';env_file.write_text('NODE_ENV=production\n')
            env={**os.environ,'PATH':str(root)+os.pathsep+os.environ['PATH'],'MOCK_STATE':str(state_path),'HRMS_V2_ENV_FILE':str(env_file),'HRMS_V2_LOCK_FILE':str(root/'lock'),'HRMS_V2_HEALTH_ATTEMPTS':'2',**overrides}
            result=subprocess.run(['bash',str(SCRIPT),image,REVISION],env=env,capture_output=True,text=True)
            return result,json.loads(state_path.read_text())

    def test_success_retains_previous_container(self):
        result,state=self.run_deploy({'hrms-api-v2':'old'})
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(state,{'hrms-api-v2':'new','hrms-api-v2-previous':'old'})

    def test_readiness_failure_restores_previous(self):
        result,state=self.run_deploy({'hrms-api-v2':'old'},FAIL_HEALTH='1')
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(state,{'hrms-api-v2':'old'})

    def test_start_failure_restores_previous(self):
        result,state=self.run_deploy({'hrms-api-v2':'old'},FAIL_RUN='1')
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(state,{'hrms-api-v2':'old'})

    def test_rejects_mutable_or_mismatched_images(self):
        for image in ['hrms-api-v2:latest','hrms-api-v2:'+'a'*40,IMAGE+';id']:
            result,state=self.run_deploy({'hrms-api-v2':'old'},image=image)
            self.assertNotEqual(result.returncode,0)
            self.assertEqual(state,{'hrms-api-v2':'old'})

    def run_receiver(self, archive, command=f'deploy {IMAGE} {REVISION}'):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);bin_dir=root/'bin';bin_dir.mkdir();called=root/'called.json';env_file=root/'runtime.env';env_file.write_text('NODE_ENV=production\n')
            flock=bin_dir/'flock';flock.write_text('#!/bin/sh\nexit 0\n');flock.chmod(0o755)
            docker=bin_dir/'docker';docker.write_text("#!/usr/bin/env python3\nimport sys\na=sys.argv[1:]\nif a[0]=='load':sys.stdin.buffer.read()\nelif a[:2]!=['image','inspect']:sys.exit(2)\n");docker.chmod(0o755)
            deploy=bin_dir/'deploy';deploy.write_text("#!/usr/bin/env python3\nimport json,sys\nopen("+repr(str(called))+",'w').write(json.dumps(sys.argv[1:]))\n");deploy.chmod(0o755)
            env={**os.environ,'PATH':str(bin_dir)+os.pathsep+os.environ['PATH'],'HRMS_V2_RUNTIME_ENV':str(env_file),'HRMS_V2_RECEIVE_LOCK_FILE':str(root/'lock'),'HRMS_V2_DEPLOY_COMMAND':str(deploy)}
            result=subprocess.run(['bash',str(ROOT/'receive.sh'),command],input=archive,capture_output=True,env=env)
            return result,json.loads(called.read_text()) if called.exists() else None

    def test_receiver_loads_archive_and_invokes_fixed_deployer(self):
        result,args=self.run_receiver(gzip.compress(b'image'))
        self.assertEqual(result.returncode,0,result.stderr.decode())
        self.assertEqual(args,[IMAGE,REVISION])

    def test_receiver_rejects_arbitrary_commands(self):
        for command in ['whoami',f'deploy {IMAGE} {REVISION};id',f'deploy hrms-api-v2:latest {REVISION}']:
            result,args=self.run_receiver(gzip.compress(b'image'),command)
            self.assertEqual(result.returncode,2)
            self.assertIsNone(args)

if __name__ == '__main__': unittest.main()
