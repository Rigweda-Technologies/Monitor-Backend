const objectIdPattern = /^[a-f0-9]{24}$/i;

export const createRoleSeedCommand = ({ Organization, seedOrganizationRoles }) => async ({ apply=false, organizationId }={}) => {
  if (organizationId && !objectIdPattern.test(String(organizationId))) throw new Error('organizationId must be a valid MongoDB ObjectId.');
  const filter=organizationId?{_id:String(organizationId),code:{$ne:'SYSTEM'}}:{code:{$ne:'SYSTEM'}};
  const organizations=await Organization.find(filter).select('_id');
  if (!apply) return { dryRun:true, matched:organizations.length, seeded:0 };
  for (const organization of organizations) await seedOrganizationRoles(organization._id);
  return { dryRun:false, matched:organizations.length, seeded:organizations.length };
};
