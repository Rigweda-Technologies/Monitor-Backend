import mongoose from 'mongoose';

export const createEmployeeModels = connection => {
  const objectId=mongoose.Schema.Types.ObjectId;
  const emergency=new mongoose.Schema({name:String,relation:String,phone:String},{_id:false});
  const document=new mongoose.Schema({fileName:String,fileUrl:String,mimeType:String,uploadedAt:Date},{_id:false});
  const schema=new mongoose.Schema({
    organizationId:{type:objectId,ref:'organizations',required:true,index:true},userId:{type:objectId,ref:'users',required:true,unique:true},
    firstName:{type:String,required:true,trim:true},lastName:{type:String,required:true,trim:true},phone:String,
    employeeCode:{type:String,required:true},departmentId:{type:objectId,ref:'departments'},designationId:{type:objectId,ref:'designations'},
    dateOfJoining:{type:Date,required:true},employmentType:{type:String,enum:['full_time','part_time','contract'],required:true},profileCompleted:{type:Boolean,default:false},
    dob:Date,gender:String,bloodGroup:String,address:{line1:String,line2:String,city:String,state:String,country:String,zip:String},emergencyContacts:{type:[emergency],default:[]},profileImage:{type:String,default:null},addressProof:{type:document,default:null},aadhaarNumber:{type:String,default:null},panNumber:{type:String,default:null},aadhaarProof:{type:document,default:null},panProof:{type:document,default:null},
    managerId:{type:objectId,ref:'employees'},leaveApprovalFlowId:{type:objectId,ref:'approval_flows',default:null},attendanceApprovalFlowId:{type:objectId,ref:'approval_flows',default:null},shiftId:{type:objectId,ref:'shifts',default:null},
    status:{type:String,enum:['active','on_leave','resigned'],default:'active'},employmentLifecycleStatus:{type:String,enum:['probation','confirmed','notice','terminated'],default:'probation'},probationPeriodDays:{type:Number,default:90},probationStartDate:Date,probationEndDate:Date,probationCompletedAt:{type:Date,default:null},confirmedDate:{type:Date,default:null},probationCompletionNotifiedAt:{type:Date,default:null},noticePeriodDays:{type:Number,default:30},noticeStartDate:{type:Date,default:null},noticeEndDate:{type:Date,default:null},lastWorkingDay:{type:Date,default:null},benefitsEligible:{type:Boolean,default:false},isDeleted:{type:Boolean,default:false},deletedAt:Date,deletedBy:{type:objectId,ref:'users'},
  },{timestamps:true,collection:'employees',autoCreate:false,autoIndex:false});
  schema.index({organizationId:1,employeeCode:1},{unique:true});
  schema.pre(/^find/,function(){if(this.getOptions()?.includeDeleted)return;if(Object.prototype.hasOwnProperty.call(this.getQuery(),'isDeleted'))return;this.where({isDeleted:false});});
  const Employee=connection.models.employees||connection.model('employees',schema,'employees');
  return {Employee};
};
