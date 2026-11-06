const linkedUsersQuery = organizationId => ({$or:[
  {organizationIds:organizationId},
  {activeOrganizationId:organizationId},
  {'softDeleteMeta.organizationId':organizationId},
]});

export const buildHardDeleteSummary = async ({models,payrollRepository,organizationId}) => {
  const organization=await models.Organization.findById(organizationId).select('name code status isSoftDeleted').lean();
  if(!organization)throw new Error('Organization not found');
  const scopedModels=Object.values(models.scopedModels||[])
    .filter(model=>!['organizations','users'].includes(String(model.modelName||'').toLowerCase())&&model?.schema?.path('organizationId'))
    .sort((left,right)=>left.collection.name.localeCompare(right.collection.name));
  const collectionCounts=[];
  for(const model of scopedModels){
    const count=await model.countDocuments({organizationId});
    if(count>0)collectionCounts.push({modelName:model.modelName,collectionName:model.collection.name,count});
  }
  const users=await models.User.find(linkedUsersQuery(organizationId),{_id:1,organizationIds:1}).lean();
  const orphanUsers=users.filter(user=>!Array.isArray(user.organizationIds)||user.organizationIds.length<=1);
  return {
    organization,
    collectionCounts,
    linkedUsers:users.length,
    orphanUsers:orphanUsers.length,
    multiOrgUsers:users.length-orphanUsers.length,
    membershipCount:await models.Membership.countDocuments({organizationId}),
    payrollTenantCount:await payrollRepository?.countTenantsForOrganization?.(String(organizationId))||0,
  };
};

export const createHardDeleteCommand = ({models,payrollRepository,hardDelete}) => async ({organizationId,actorUserId,confirmationCode,execute=false}) => {
  const beforeSummary=await buildHardDeleteSummary({models,payrollRepository,organizationId});
  if(!execute)return {mode:'dry-run',organizationId:String(organizationId),beforeSummary};
  const result=await hardDelete({organizationId,action:'hard_delete',actorUserId,confirmationCode});
  return {mode:'executed',organizationId:String(organizationId),actorUserId,confirmationCode,beforeSummary,result};
};
