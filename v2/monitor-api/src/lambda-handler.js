export const createLambdaHandler = ({ app, adapt }) => {
  if (!app) throw new TypeError("app is required.");
  if (typeof adapt !== "function") throw new TypeError("adapt must be a function.");

  const proxy = adapt(app, { callbackWaitsForEmptyEventLoop: false });
  return (event, context) => proxy(event, context);
};
