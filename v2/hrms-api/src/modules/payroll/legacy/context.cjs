const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();
const withPayrollContext = (context, callback) => storage.run(context, callback);
const current = () => storage.getStore();
const model = name => new Proxy({}, {
  get(_target, property) {
    const value = current()?.models?.[name]?.[property];
    return typeof value === 'function' ? value.bind(current().models[name]) : value;
  },
});
const payrollOptions = () => current()?.payrollOptions || {};
module.exports = { withPayrollContext, current, model, payrollOptions };
