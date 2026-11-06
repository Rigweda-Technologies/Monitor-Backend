const normalize = value => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-').replace(/-+/g, '-');
exports.isAdminOverrideActor = actor => ['admin','org-admin','superadmin'].includes(normalize(actor?.actorRoleSlug));
