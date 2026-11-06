const test = require("node:test");
const assert = require("node:assert/strict");

const swaggerSpec = require("../swagger");

test("Swagger Try it out targets the current deployment origin", () => {
  assert.deepEqual(swaggerSpec.servers, [
    {
      url: "/api/v1",
      description: "Current HRMS V1 server"
    }
  ]);
});
