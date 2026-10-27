import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'deploy.sh'
IMAGE = '123456789012.dkr.ecr.ap-south-1.amazonaws.com/hrms@sha256:' + 'a' * 64

MOCK = '''#!/usr/bin/env python3
import os, sys, json
from pathlib import Path
state_path = Path(os.environ['MOCK_STATE'])
state = json.loads(state_path.read_text())
args=sys.argv[1:]
cmd=Path(sys.argv[0]).name
code=0
if cmd=='aws': print('test-password')
elif cmd=='sleep' or cmd=='flock': pass
elif cmd=='curl':
    code = 1 if os.environ.get('FAIL_HEALTH')=='1' and state.get('hrms-backend')=='new' else 0
elif cmd=='docker':
    op=args[0]
    if op=='image': pass
    elif op in ['login','pull']: code=1 if op=='pull' and os.environ.get('FAIL_PULL')=='1' else 0
    elif op=='inspect':
        name=args[-1]
        if name not in state: code=1
        else: print(state[name])
    elif op=='rm': state.pop(args[-1],None)
    elif op=='stop': pass
    elif op=='rename': state[args[2]]=state.pop(args[1])
    elif op=='start': pass
    elif op=='run':
        state[args[args.index('--name')+1]]='new'
        code=1 if os.environ.get('FAIL_RUN')=='1' else 0
    else: raise Exception(args)
state_path.write_text(json.dumps(state))
sys.exit(code)
'''

class DeploymentTests(unittest.TestCase):
    def run_deploy(self, state=None, image=IMAGE, **overrides):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            for cmd in ['aws','docker','curl','sleep','flock']:
                path=root/cmd; path.write_text(MOCK); path.chmod(0o755)
            state_path=root/'state.json';state_path.write_text(json.dumps(state or {}))
            env_file=root/'runtime.env';env_file.write_text('NODE_ENV=production\n')
            env={**os.environ, 'PATH':str(root)+os.pathsep+os.environ['PATH'],
                 'MOCK_STATE':str(state_path),'HRMS_ENV_FILE':str(env_file),
                 'HRMS_LOCK_FILE':str(root/'lock'),'HRMS_HEALTH_ATTEMPTS':'2', **overrides}
            result=subprocess.run(['bash',str(SCRIPT),image,'ap-south-1','b'*40],env=env,capture_output=True,text=True)
            return result,json.loads(state_path.read_text())
    def test_local_image_id_deploys_without_registry(self):
        result,state=self.run_deploy({'hrms-backend':'old'},image='sha256:'+'a'*64)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(state['hrms-backend'],'new')
    def test_receiver_rejects_arbitrary_shell_commands(self):
        receiver=SCRIPT.with_name('receive.sh')
        for command in ['whoami', 'deploy latest bad', 'deploy sha256:'+'a'*64+' '+'b'*40+';id']:
            result=subprocess.run(['bash',str(receiver),command],capture_output=True,text=True)
            self.assertEqual(result.returncode,2)
    def test_success_retains_previous_container(self):
        result,state=self.run_deploy({'hrms-backend':'old'})
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(state,{'hrms-backend':'new','hrms-backend-previous':'old'})
    def test_readiness_failure_restores_previous_and_fails(self):
        result,state=self.run_deploy({'hrms-backend':'old'},FAIL_HEALTH='1')
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(state,{'hrms-backend':'old'})
    def test_start_failure_restores_previous(self):
        result,state=self.run_deploy({'hrms-backend':'old'},FAIL_RUN='1')
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(state,{'hrms-backend':'old'})
    def test_pull_failure_leaves_current_untouched(self):
        result,state=self.run_deploy({'hrms-backend':'old'},FAIL_PULL='1')
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(state,{'hrms-backend':'old'})
    def test_initial_failure_removes_unhealthy_container(self):
        result,state=self.run_deploy(FAIL_HEALTH='1')
        self.assertNotEqual(result.returncode,0)
        self.assertEqual(state,{})
    def test_rejects_mutable_or_shell_injected_image(self):
        for image in ['repo:latest', IMAGE+'; touch /tmp/not-allowed']:
            result,state=self.run_deploy({'hrms-backend':'old'},image=image)
            self.assertNotEqual(result.returncode,0)
            self.assertEqual(state,{'hrms-backend':'old'})

if __name__=='__main__': unittest.main()
