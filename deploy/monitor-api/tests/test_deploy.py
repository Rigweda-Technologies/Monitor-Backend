import gzip
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
IMAGE = "monitor-v2:" + "b" * 40
REVISION = "b" * 40

MOCK = '''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
args=sys.argv[1:]
cmd=Path(sys.argv[0]).name
state_path=Path(os.environ["MOCK_STATE"])
state=json.loads(state_path.read_text())
code=0
if cmd in ("flock", "sleep"):
    pass
elif cmd == "curl":
    if os.environ.get("FAIL_HEALTH") == "1" and state.get("monitor-v2") == "new": code=1
elif cmd == "docker":
    if args[:3] == ["image", "inspect", "--format"]: print(os.environ["MOCK_REVISION"])
    elif args[0] == "image": pass
    elif args[0] == "inspect":
        name=args[-1]
        if name not in state: code=1
        else: print(state[name])
    elif args[0] == "rm": state.pop(args[-1], None)
    elif args[0] == "stop": pass
    elif args[0] == "rename": state[args[2]]=state.pop(args[1])
    elif args[0] == "start": pass
    elif args[0] == "run":
        state[args[args.index("--name")+1]]="new"
        if os.environ.get("FAIL_RUN") == "1": code=1
    elif args[0] == "load": sys.stdin.buffer.read()
    else: raise RuntimeError(args)
state_path.write_text(json.dumps(state))
sys.exit(code)
'''


class MonitorDeploymentTests(unittest.TestCase):
    def setup_bin(self, root):
        bin_dir = root / "bin"
        bin_dir.mkdir()
        for name in ["docker", "curl", "sleep", "flock"]:
            path = bin_dir / name
            path.write_text(MOCK)
            path.chmod(0o755)
        return bin_dir

    def run_deploy(self, initial=None, **overrides):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = self.setup_bin(root)
            state_file = root / "state.json"
            state_file.write_text(json.dumps(initial or {}))
            env_file = root / "runtime.env"
            env_file.write_text("DATABASE_URL=postgresql://test\n")
            env = {
                **os.environ,
                "PATH": str(bin_dir) + os.pathsep + os.environ["PATH"],
                "MOCK_STATE": str(state_file),
                "MOCK_REVISION": REVISION,
                "MONITOR_V2_ENV_FILE": str(env_file),
                "MONITOR_V2_LOCK_FILE": str(root / "lock"),
                "MONITOR_V2_HEALTH_ATTEMPTS": "2",
                **overrides,
            }
            result = subprocess.run(["bash", str(ROOT / "deploy.sh"), IMAGE, REVISION], env=env, capture_output=True, text=True)
            return result, json.loads(state_file.read_text())

    def test_deploy_replaces_container_and_retains_rollback(self):
        result, state = self.run_deploy({"monitor-v2": "old"})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(state, {"monitor-v2": "new", "monitor-v2-previous": "old"})

    def test_readiness_failure_restores_previous_container(self):
        result, state = self.run_deploy({"monitor-v2": "old"}, FAIL_HEALTH="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(state, {"monitor-v2": "old"})

    def test_invalid_or_mismatched_revision_is_rejected_before_deploy(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = self.setup_bin(root)
            state_file = root / "state.json"
            state_file.write_text("{}")
            env = {**os.environ, "PATH": str(bin_dir) + os.pathsep + os.environ["PATH"], "MOCK_STATE": str(state_file)}
            result = subprocess.run(["bash", str(ROOT / "deploy.sh"), IMAGE, "c" * 40], env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            self.assertEqual(json.loads(state_file.read_text()), {})

    def test_receiver_rejects_arbitrary_commands_and_revision_mismatch(self):
        for command in ["whoami", f"deploy-monitor {IMAGE} {'c' * 40}", f"deploy-monitor {IMAGE} {REVISION};id"]:
            result = subprocess.run(["bash", str(ROOT / "receive.sh"), command], capture_output=True)
            self.assertEqual(result.returncode, 2)

    def test_receiver_loads_only_commit_tagged_archive_and_invokes_fixed_deployer(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bin_dir = root / "bin"
            bin_dir.mkdir()
            for name in ["docker", "flock"]:
                command = bin_dir / name
                command.write_text(MOCK)
                command.chmod(0o755)
            state_file = root / "state.json"
            state_file.write_text("{}")
            deploy = bin_dir / "deploy"
            deploy.write_text(f"#!/bin/sh\nprintf '%s\\n' \"$@\" > {state_file}\n")
            deploy.chmod(0o755)
            env = {
                **os.environ,
                "PATH": str(bin_dir) + os.pathsep + os.environ["PATH"],
                "MOCK_STATE": str(state_file),
                "MONITOR_V2_DEPLOY_COMMAND": str(deploy),
                "MONITOR_V2_RECEIVE_LOCK_FILE": str(root / "receive.lock"),
            }
            archive = gzip.compress(b"validated docker archive")
            result = subprocess.run(
                ["bash", str(ROOT / "receive.sh"), f"deploy-monitor {IMAGE} {REVISION}"],
                input=archive,
                capture_output=True,
                env=env,
            )
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            self.assertEqual(state_file.read_text().splitlines(), [IMAGE, REVISION])

    def test_bootstrap_trust_uses_this_repositories_immutable_development_subject(self):
        template = (ROOT / "bootstrap.yaml").read_text()
        self.assertIn(
            "token.actions.githubusercontent.com:sub: "
            "repo:Rigweda-Technologies@290628100/Monitor-Backend@1433043932:ref:refs/heads/development",
            template,
        )

    def test_bootstrap_execution_role_allows_only_the_sam_transform_change_set(self):
        template = (ROOT / "bootstrap.yaml").read_text()
        self.assertIn("Sid: AllowServerlessTransform", template)
        self.assertIn("Action: cloudformation:CreateChangeSet", template)
        self.assertIn(
            "arn:${AWS::Partition}:cloudformation:${AWS::Region}:aws:transform/Serverless-2016-10-31",
            template,
        )

    def test_bootstrap_deploy_role_can_read_monitor_stack_template_summary(self):
        template = (ROOT / "bootstrap.yaml").read_text()
        deploy_policy = template.split("Sid: ManageMonitorStack", 1)[1].split(
            "Sid: ReadDeploymentRole", 1
        )[0]
        self.assertIn("- cloudformation:GetTemplateSummary", deploy_policy)
        self.assertIn("stack/monitor-v2-development/*", deploy_policy)

    def test_bootstrap_execution_role_can_tag_only_monitor_v2_api_gateway_apis(self):
        template = (ROOT / "bootstrap.yaml").read_text()
        self.assertIn("Sid: ManageMonitorHttpApiTags", template)
        self.assertIn("- apigateway:POST", template)
        self.assertIn(
            "::/tags/arn%3A${AWS::Partition}%3Aapigateway%3A${AWS::Region}%3A%3A%2Fv2%2Fapis%2F*'",
            template,
        )

    def test_bootstrap_execution_role_can_create_monitor_http_api_at_collection_path(self):
        template = (ROOT / "bootstrap.yaml").read_text()
        self.assertRegex(
            template,
            r"Sid: CreateMonitorHttpApi\s+Effect: Allow\s+Action: apigateway:PUT\s+"
            r"Resource: !Sub 'arn:\$\{AWS::Partition\}:apigateway:\$\{AWS::Region\}::/apis'",
        )

    def test_bootstrap_execution_role_can_tag_monitor_http_api_resources(self):
        template = (ROOT / "bootstrap.yaml").read_text()
        self.assertRegex(
            template,
            r"Sid: ManageMonitorHttpApiResourceTags\s+Effect: Allow\s+Action:\s+"
            r"- apigateway:TagResource\s+- apigateway:UntagResource\s+"
            r"Resource: !Sub 'arn:\$\{AWS::Partition\}:apigateway:\$\{AWS::Region\}::/apis/\*'",
        )

    def test_lambda_post_route_uses_explicit_api_gateway_v2_proxy_resources(self):
        template = (ROOT / "template.yaml").read_text()
        lambda_resource = template.split("  MonitorLambda:\n", 1)[1].split(
            "  MonitorPostIntegration:\n", 1
        )[0]
        self.assertNotIn("Events:", lambda_resource)
        self.assertIn("Type: AWS::ApiGatewayV2::Integration", template)
        self.assertIn("IntegrationType: AWS_PROXY", template)
        self.assertIn("PayloadFormatVersion: '2.0'", template)
        self.assertIn("RouteKey: 'POST /api/v2/{proxy+}'", template)
        self.assertIn("Type: AWS::Lambda::Permission", template)
        self.assertIn(
            "/*/POST/api/v2/*'",
            template,
        )
        self.assertNotIn(
            "repo:Rigweda-Technologies/Monitor-Backend:ref:refs/heads/development",
            template,
        )

    def test_lambda_deployment_acknowledges_named_iam_resources(self):
        workflow = (ROOT.parents[1] / ".github/workflows/monitor-v2.yml").read_text()
        self.assertIn("--capabilities CAPABILITY_NAMED_IAM", workflow)

    def test_monitor_only_changes_do_not_trigger_hrms_dependency_audit_or_deploy(self):
        workflow = (ROOT.parents[1] / ".github/workflows/hrms-production.yml").read_text()
        self.assertIn("git diff --quiet \"$BASE_SHA\" \"$HEAD_SHA\" --", workflow)
        self.assertIn("if: needs.scope.outputs.hrms_changed == 'true'", workflow)
        self.assertIn("needs.scope.outputs.hrms_changed == 'true'", workflow)

if __name__ == "__main__":
    unittest.main()
