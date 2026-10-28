import awsLambdaFastify from "@fastify/aws-lambda";
import { loadConfig } from "./config/env.js";
import { createLambdaHandler } from "./lambda-handler.js";
import { loadLambdaRuntimeSecrets } from "./lambda-secrets.js";
import { createMonitorRuntime } from "./runtime.js";

const runtimeSecrets = await loadLambdaRuntimeSecrets();
const runtime = await createMonitorRuntime({
  config: loadConfig({ ...process.env, ...runtimeSecrets }),
});
const proxy = createLambdaHandler({ app: runtime.app, adapt: awsLambdaFastify });
await runtime.app.ready();

export const handler = proxy;
