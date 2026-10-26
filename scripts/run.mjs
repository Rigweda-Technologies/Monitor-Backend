import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(path.join(root, "services.json"), "utf8"));
const [service = config.default, mode = "local"] = process.argv.slice(2);
if (!(service in config.services) || !["local", "server"].includes(mode)) {
  console.error(`Usage: node scripts/run.mjs <${Object.keys(config.services).join("|")}> <local|server>`);
  process.exit(1);
}
let stopping = false;
const children = [];
let forceTimer;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) if (child.exitCode === null) child.kill("SIGTERM");
  forceTimer = setTimeout(() => {
    for (const child of children) if (child.exitCode === null) child.kill("SIGKILL");
  }, 5000);
  forceTimer.unref();
}
for (const item of config.services[service]) {
  const cwd = path.join(root, item.cwd);
  let command = process.execPath;
  let args = item.args;
  if (item.python) {
    const venv = path.join(cwd, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
    command = process.env.PYTHON || process.env.PYTHON3 || (existsSync(venv) ? venv : process.platform === "win32" ? "python" : "python3");
  }
  if (item.vite) args = [...args, "--mode", mode === "local" ? "development-local" : "server", "--strictPort"];
  console.log(`Starting ${item.label} (${mode})`);
  const child = spawn(command, args, { cwd, env: { ...process.env, APP_ENV: mode }, stdio: "inherit", shell: false });
  children.push(child);
  child.on("error", error => { console.error(`${item.label}: ${error.message}`); stop(1); });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`${item.label} exited (${signal || code}).`);
      stop(code || 1);
    }
    if (children.every(p => p.exitCode !== null || p.signalCode !== null)) clearTimeout(forceTimer);
  });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
