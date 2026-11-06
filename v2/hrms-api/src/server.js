import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createRuntime } from './runtime.js';
import { startupFailureMessage } from './config/startup-error.js';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
let runtime;
try {
  runtime = await createRuntime();
  await runtime.app.listen({ port: runtime.config.port, host: runtime.config.host });
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 15000).unref();
    try { await runtime.close(); } catch { process.exitCode = 1; } finally { clearTimeout(deadline); }
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
} catch (error) {
  // Startup errors may include credential-bearing database URLs. The formatter
  // only emits allowlisted configuration errors or safe dependency categories.
  console.error(startupFailureMessage(error));
  if (runtime) await runtime.close().catch(() => {});
  process.exitCode = 1;
}
