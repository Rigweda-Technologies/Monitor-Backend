const DEFAULT_REQUEST_BODY_LIMIT = "64mb";

function getRequestBodyLimit() {
  return String(process.env.REQUEST_BODY_LIMIT || DEFAULT_REQUEST_BODY_LIMIT).trim() || DEFAULT_REQUEST_BODY_LIMIT;
}

module.exports = {
  DEFAULT_REQUEST_BODY_LIMIT,
  getRequestBodyLimit
};
