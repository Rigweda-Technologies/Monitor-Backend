import { httpError } from '../../plugins/errors.js';

const normalizeSteps = steps => [...steps].map(step => ({
  stepNumber: Number(step.stepNumber), approverType: step.approverType,
  roleSlug: step.approverType === 'role' ? String(step.roleSlug || '').trim() : null,
  employeeId: step.approverType === 'employee' ? step.employeeId : null,
})).sort((a, b) => a.stepNumber - b.stepNumber);
const normalizeRange = flow => ({ min: flow.minDays == null ? -Infinity : Number(flow.minDays), max: flow.maxDays == null ? Infinity : Number(flow.maxDays) });
const isDefaultRange = flow => flow.minDays == null && flow.maxDays == null;

export const createApprovalFlowService = models => {
  const validateSteps = async (organizationId, steps) => {
    if (!Array.isArray(steps) || !steps.length) throw httpError(500, 'At least one approval step is required');
    const numbers = steps.map(step => Number(step.stepNumber));
    if (new Set(numbers).size !== numbers.length) throw httpError(500, 'Step numbers must be unique');
    if ([...numbers].sort((a,b) => a-b).some((number,index) => number !== index + 1)) throw httpError(500, 'Step numbers must be continuous starting from 1');
    const employeeIds = [...new Set(steps.filter(s => s.approverType === 'employee').map(s => String(s.employeeId)).filter(Boolean))];
    if (employeeIds.length && await models.Employee.countDocuments({ _id: { $in: employeeIds }, organizationId, status: 'active' }) !== employeeIds.length) throw httpError(500, 'One or more employee approvers are invalid or inactive');
    const roleSlugs = [...new Set(steps.filter(s => s.approverType === 'role').map(s => s.roleSlug).filter(Boolean))];
    if (roleSlugs.length && await models.Role.countDocuments({ organizationId, slug: { $in: roleSlugs } }) !== roleSlugs.length) throw httpError(500, 'One or more role approvers are invalid');
  };
  const validateOverlap = async ({ organizationId, moduleKey, minDays, maxDays, isActive, excludeId }) => {
    if (!isActive) return;
    const flows = await models.ApprovalFlow.find({ organizationId, moduleKey, isActive: true, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('name minDays maxDays');
    const current = normalizeRange({ minDays, maxDays });
    for (const flow of flows) {
      if (isDefaultRange({ minDays, maxDays }) && isDefaultRange(flow)) throw httpError(500, `Default active flow already exists as "${flow.name}"`);
      if (!isDefaultRange({ minDays, maxDays }) && !isDefaultRange(flow)) {
        const existing = normalizeRange(flow);
        if (current.min <= existing.max && existing.min <= current.max) throw httpError(500, `Active range overlaps with flow "${flow.name}"`);
      }
    }
  };
  const validateDays = (minDays, maxDays) => {
    if (minDays == null) throw httpError(500, 'Min days is required');
    if (maxDays != null && Number(minDays) > Number(maxDays)) throw httpError(500, 'minDays cannot be greater than maxDays');
  };
  return {
    async create(request) {
      const { organizationId } = request.user; const body = request.body; const steps = normalizeSteps(body.steps);
      validateDays(body.minDays, body.maxDays); await validateSteps(organizationId, steps);
      await validateOverlap({ organizationId, moduleKey: body.moduleKey, minDays: body.minDays ?? null, maxDays: body.maxDays ?? null, isActive: Boolean(body.isActive ?? true) });
      return models.ApprovalFlow.create({ organizationId, moduleKey: body.moduleKey, name: body.name, isActive: body.isActive ?? true, minDays: body.minDays ?? null, maxDays: body.maxDays ?? null, steps });
    },
    list: request => models.ApprovalFlow.find({ organizationId: request.user.organizationId, ...(request.query.moduleKey ? { moduleKey: request.query.moduleKey } : {}) }).populate('steps.employeeId', 'firstName lastName employeeCode').sort({ moduleKey: 1, createdAt: -1 }),
    async update(request) {
      const { organizationId } = request.user; const existing = await models.ApprovalFlow.findOne({ _id: request.params.id, organizationId });
      if (!existing) throw httpError(500, 'Approval flow not found');
      const update = { ...request.body };
      const moduleKey = update.moduleKey || existing.moduleKey;
      const minDays = Object.hasOwn(update, 'minDays') ? update.minDays : existing.minDays;
      const maxDays = Object.hasOwn(update, 'maxDays') ? update.maxDays : existing.maxDays;
      const isActive = Object.hasOwn(update, 'isActive') ? Boolean(update.isActive) : Boolean(existing.isActive);
      const steps = normalizeSteps(Array.isArray(update.steps) ? update.steps : existing.steps || []);
      validateDays(minDays, maxDays); await validateSteps(organizationId, steps);
      await validateOverlap({ organizationId, moduleKey, minDays, maxDays, isActive, excludeId: existing._id });
      if (Array.isArray(update.steps)) update.steps = steps;
      const flow = await models.ApprovalFlow.findOneAndUpdate({ _id: request.params.id, organizationId }, update, { returnDocument: 'after' }).populate('steps.employeeId', 'firstName lastName employeeCode');
      if (!flow) throw httpError(500, 'Approval flow not found'); return flow;
    },
    async remove(request) {
      const flow = await models.ApprovalFlow.findOne({ _id: request.params.id, organizationId: request.user.organizationId });
      if (!flow) throw httpError(500, 'Approval flow not found');
      if (flow.isActive) { flow.isActive = false; await flow.save(); }
      return flow;
    },
  };
};
