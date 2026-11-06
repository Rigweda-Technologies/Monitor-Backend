const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");

test("runtime authentication and bootstrap logs do not print passwords", () => {
  const sources = [
    read("app.js"),
    read("src/modules/users/user.service.js"),
    read("src/script/bootstrap.system.js")
  ].join("\n");

  assert.doesNotMatch(sources, /Attempting login with email/);
  assert.doesNotMatch(sources, /console\.log\([^\n]*bootstrapResult\.password/);
  assert.doesNotMatch(sources, /SuperAdmin@123/);
});
