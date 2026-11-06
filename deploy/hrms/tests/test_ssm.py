import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('ssm_deploy', Path(__file__).resolve().parents[1] / 'ssm-deploy.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
ENV = {
    'ECR_IMAGE': '123456789012.dkr.ecr.ap-south-1.amazonaws.com/hrms@sha256:' + 'a'*64,
    'AWS_REGION': 'ap-south-1', 'EC2_INSTANCE_ID': 'i-'+'a'*17, 'SOURCE_SHA': 'b'*40
}

def result(status, code=0):
    return subprocess.CompletedProcess([], 0, json.dumps({'Status': status, 'ResponseCode': code}), '')

class SsmTests(unittest.TestCase):
    @patch.dict(os.environ, ENV)
    def test_success_targets_exact_instance_and_requires_zero_response(self):
        with patch.object(module.subprocess, 'check_output', return_value=json.dumps({'Command': {'CommandId': 'test'}})) as send, \
             patch.object(module.subprocess, 'run', return_value=result('Success')):
            module.main()
        args=send.call_args.args[0]
        payload=json.loads(args[args.index('--cli-input-json')+1])
        self.assertEqual(payload['InstanceIds'],[ENV['EC2_INSTANCE_ID']])
        self.assertEqual(payload['Parameters']['executionTimeout'],['600'])
    @patch.dict(os.environ, ENV)
    def test_eventual_consistency_waits_then_succeeds(self):
        missing=subprocess.CompletedProcess([],254,'','InvocationDoesNotExist')
        with patch.object(module.subprocess,'check_output',return_value='{"Command":{"CommandId":"test"}}'), \
             patch.object(module.subprocess,'run',side_effect=[missing,result('InProgress'),result('Success')]), \
             patch.object(module.time,'sleep'):
            module.main()
    @patch.dict(os.environ, ENV)
    def test_failed_or_nonzero_invocation_never_passes(self):
        for status,code in [('Failed',1),('TimedOut',1),('Cancelled',1),('Success',1)]:
            with self.subTest(status=status), \
                 patch.object(module.subprocess,'check_output',return_value='{"Command":{"CommandId":"test"}}'), \
                 patch.object(module.subprocess,'run',return_value=result(status,code)):
                with self.assertRaises(RuntimeError): module.main()
    @patch.dict(os.environ, {**ENV,'EC2_INSTANCE_ID':'i-bad; echo unsafe'})
    def test_invalid_target_never_calls_aws(self):
        with patch.object(module.subprocess,'check_output') as send:
            with self.assertRaises(ValueError): module.main()
            send.assert_not_called()
    @patch.dict(os.environ, ENV)
    def test_deadline_cancels_command_and_fails(self):
        with patch.object(module.subprocess,'check_output',return_value='{"Command":{"CommandId":"test"}}'), \
             patch.object(module.time,'monotonic',side_effect=[0,901]), \
             patch.object(module.subprocess,'run') as cancel:
            with self.assertRaises(TimeoutError): module.main()
            self.assertIn('cancel-command',cancel.call_args.args[0])

if __name__ == '__main__': unittest.main()
