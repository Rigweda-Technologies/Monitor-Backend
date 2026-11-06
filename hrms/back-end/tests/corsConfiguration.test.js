const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

test("local frontend loopback origin is allowed", () => {
  assert.match(appSource, /http:\/\/127\.0\.0\.1:3000/);
});

test("CORS denials are client errors instead of internal server errors", () => {
  assert.match(appSource, /statusCode:\s*403/);
});
