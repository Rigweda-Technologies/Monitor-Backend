const normalizeEmail = value => String(value || '').trim().toLowerCase();

export const createSystemBootstrapService = ({ models, hashPassword }) => async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('HRMS_BOOTSTRAP_EMAIL must be a valid email address.');
  if (typeof password !== 'string' || password.length < 12) throw new Error('HRMS_BOOTSTRAP_PASSWORD must contain at least 12 characters.');

  const existingSystemOrg = await models.Organization.findOne({ code:'SYSTEM' });
  const existingUser = await models.User.findOne({ email:normalizedEmail });
  if (existingUser) {
    if (!existingSystemOrg) throw new Error('Bootstrap email is already registered; refusing to grant SYSTEM access.');
    const [systemRole, membership] = await Promise.all([
      models.Role.findOne({ organizationId:existingSystemOrg._id, slug:'superadmin' }),
      models.Membership.findOne({ userId:existingUser._id, organizationId:existingSystemOrg._id }),
    ]);
    const linked = (existingUser.organizationIds || []).some(id => String(id) === String(existingSystemOrg._id));
    const assigned = systemRole && (membership?.roleIds || []).some(id => String(id) === String(systemRole._id));
    if (linked && assigned) return { created:false, systemOrgId:String(existingSystemOrg._id), email:normalizedEmail };
    throw new Error('Bootstrap email is already registered; refusing to grant SYSTEM access.');
  }

  const organization = existingSystemOrg || await models.Organization.create({
    name:'SYSTEM', code:'SYSTEM', timezone:'Asia/Kolkata', currency:'USD', status:'active',
  });
  let permission = await models.Permission.findOne({ organizationId:organization._id, code:'*' });
  if (!permission) permission = await models.Permission.create({ organizationId:organization._id, name:'ALL_ACCESS', code:'*', module:'SYSTEM' });
  let role = await models.Role.findOne({ organizationId:organization._id, slug:'superadmin' });
  if (!role) role = await models.Role.create({ organizationId:organization._id, name:'SuperAdmin', slug:'superadmin', permissionIds:[permission._id], isSystemRole:true });

  const user = await models.User.create({
    email:normalizedEmail,
    password:await hashPassword(password),
    organizationIds:[organization._id],
    activeOrganizationId:organization._id,
    status:'active',
  });
  try {
    await models.Membership.create({ userId:user._id, organizationId:organization._id, roleIds:[role._id] });
  } catch (error) {
    await models.User.deleteOne({ _id:user._id }).catch(() => {});
    throw error;
  }
  return { created:true, systemOrgId:String(organization._id), email:normalizedEmail };
};
