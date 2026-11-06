const test = require("node:test");
const assert = require("node:assert/strict");

const { DEFAULT_REQUEST_BODY_LIMIT, getRequestBodyLimit } = require("../src/config/requestLimits");

test("request body limit supports base64 monitor update packages", () => {
  const previous = process.env.REQUEST_BODY_LIMIT;
  delete process.env.REQUEST_BODY_LIMIT;
  try {
    assert.equal(DEFAULT_REQUEST_BODY_LIMIT, "64mb");
    assert.equal(getRequestBodyLimit(), "64mb");
  } finally {
    if (previous === undefined) delete process.env.REQUEST_BODY_LIMIT;
    else process.env.REQUEST_BODY_LIMIT = previous;
  }
});

test("request body limit can be configured from the environment", () => {
  const previous = process.env.REQUEST_BODY_LIMIT;
  process.env.REQUEST_BODY_LIMIT = "96mb";
  try {
    assert.equal(getRequestBodyLimit(), "96mb");
  } finally {
    if (previous === undefined) delete process.env.REQUEST_BODY_LIMIT;
    else process.env.REQUEST_BODY_LIMIT = previous;
  }
});
