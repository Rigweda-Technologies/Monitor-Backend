#!/usr/bin/env python3
"""Send a validated digest deployment to one instance; fail unless its invocation succeeds."""
import base64
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import time


def main():
    image = os.environ['ECR_IMAGE']
    region = os.environ['AWS_REGION']
    instance = os.environ['EC2_INSTANCE_ID']
    revision = os.environ['SOURCE_SHA']
    if not re.fullmatch(r'i-[a-f0-9]{8,17}', instance):
        raise ValueError('Invalid EC2 instance ID')
    if not re.fullmatch(r'[a-f0-9]{40}', revision):
        raise ValueError('Invalid commit')
    if not re.fullmatch(r'[a-z]{2}-[a-z]+-\d+', region):
        raise ValueError('Invalid AWS region')
    if not re.fullmatch(r'\d{12}\.dkr\.ecr\.' + re.escape(region) + r'\.amazonaws\.com/[a-z0-9/_-]+@sha256:[a-f0-9]{64}', image):
        raise ValueError('Invalid ECR digest')
    encoded = base64.b64encode(Path(__file__).with_name('deploy.sh').read_bytes()).decode()
    command = '\n'.join([
        'set -eu',
        'script=$(mktemp /tmp/hrms-deploy.XXXXXX)',
        'trap \'rm -f "$script"\' EXIT',
        f"printf %s {shlex.quote(encoded)} | base64 -d > \"$script\"",
        f'bash "$script" {shlex.quote(image)} {shlex.quote(region)} {shlex.quote(revision)}'
    ])
    payload = {
        'InstanceIds': [instance], 'DocumentName': 'AWS-RunShellScript',
        'Comment': 'HRMS deployment ' + revision,
        'TimeoutSeconds': 120,
        'Parameters': {'commands': [command], 'executionTimeout': ['600']}
    }
    response = subprocess.check_output([
        'aws', 'ssm', 'send-command', '--region', region,
        '--cli-input-json', json.dumps(payload), '--output', 'json'
    ], text=True)
    command_id = json.loads(response)['Command']['CommandId']
    print(f'SSM command {command_id} for {instance}', flush=True)
    deadline = time.monotonic() + 900
    while time.monotonic() < deadline:
        result = subprocess.run([
            'aws', 'ssm', 'get-command-invocation', '--region', region,
            '--command-id', command_id, '--instance-id', instance, '--output', 'json'
        ], capture_output=True, text=True)
        if result.returncode:
            # Run Command invocation records are eventually consistent.
            if 'InvocationDoesNotExist' not in result.stderr:
                raise RuntimeError('Unable to read SSM invocation status: ' + result.stderr)
        else:
            invocation = json.loads(result.stdout)
            status = invocation['Status']
            if status == 'Success' and invocation.get('ResponseCode') == 0:
                print(invocation.get('StandardOutputContent', ''))
                return
            if status not in ('Pending', 'InProgress', 'Delayed', 'Cancelling'):
                print(invocation.get('StandardErrorContent', ''))
                raise RuntimeError(f'Deployment failed: {status}; command {command_id}')
        time.sleep(5)
    subprocess.run(['aws', 'ssm', 'cancel-command', '--region', region,
                    '--command-id', command_id, '--instance-ids', instance], check=False)
    raise TimeoutError('SSM verification timed out; inspect instance/container state before retrying')


if __name__ == '__main__':
    main()
