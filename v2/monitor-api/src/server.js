import { pathToFileURL } from "node:url";
import { createMonitorRuntime } from "./runtime.js";

export const startServer = async ({ config, logger = true } = {}) => {
  const runtime = await createMonitorRuntime({ config, logger });
  await runtime.app.listen({ port: runtime.config.port, host: runtime.config.host });
  runtime.app.log.info({ host: runtime.config.host, port: runtime.config.port }, "Monitor API V2 started.");
  return runtime.app;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    process.stderr.write(`Monitor API V2 startup failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
