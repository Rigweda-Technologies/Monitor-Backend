import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import awsLambdaFastify from "@fastify/aws-lambda";
import { createLambdaHandler } from "../src/lambda-handler.js";

test("Lambda adapter preserves a V2 POST request and its HTTP response contract", async (t) => {
  const app = Fastify({ logger: false });
  app.post("/api/v2/contract-check", async (request, reply) => {
    assert.equal(request.headers.authorization, "Bearer session-token");
    assert.deepEqual(request.body, { events: [{ eventId: "event-1" }] });
    return reply.code(202).send({ success: true, data: { inserted: 1, saved: 1, duplicateCount: 0 } });
  });
  const handler = createLambdaHandler({ app, adapt: awsLambdaFastify });
  t.after(() => app.close());

  const response = await handler({
    version: "2.0",
    routeKey: "POST /api/v2/contract-check",
    rawPath: "/api/v2/contract-check",
    rawQueryString: "",
    requestContext: { stage: "$default", http: { method: "POST", path: "/api/v2/contract-check" } },
    headers: { authorization: "Bearer session-token", "content-type": "application/json" },
    body: JSON.stringify({ events: [{ eventId: "event-1" }] }),
    isBase64Encoded: false,
  }, {});

  assert.equal(response.statusCode, 202);
  assert.deepEqual(JSON.parse(response.body), {
    success: true,
    data: { inserted: 1, saved: 1, duplicateCount: 0 },
  });
});

test("Lambda adapter decodes base64 multipart request bodies before Fastify validation", async (t) => {
  const app = Fastify({ logger: false });
  await app.register(multipart);
  app.post("/api/v2/screenshots", async (request) => {
    const file = await request.file();
    const data = await file.toBuffer();
    return { byteLength: data.length, content: data.toString("hex") };
  });
  const handler = createLambdaHandler({ app, adapt: awsLambdaFastify });
  t.after(() => app.close());

  const boundary = "monitor-boundary";
  const bytes = Buffer.from([0, 1, 2, 127, 128, 255]);
  const multipartBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="screenshot"; filename="screen.png"\r\nContent-Type: image/png\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const response = await handler({
    version: "2.0",
    routeKey: "POST /api/v2/screenshots",
    rawPath: "/api/v2/screenshots",
    rawQueryString: "",
    requestContext: { stage: "$default", http: { method: "POST", path: "/api/v2/screenshots" } },
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body: multipartBody.toString("base64"),
    isBase64Encoded: true,
  }, {});

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { byteLength: bytes.length, content: bytes.toString("hex") });
});
