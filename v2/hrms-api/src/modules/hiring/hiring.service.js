import { httpError } from '../../plugins/errors.js';

const toKey = value => String(value || '').trim().toLowerCase();
const normalizeCandidateStatusByStage = (stage, futureConsideration = true) => stage === 'hired' ? 'hired' : stage === 'rejected' ? (futureConsideration ? 'talent_pool' : 'rejected') : 'active';
const normalizeSkills = value => Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean).slice(0, 30) : [];
const formatEmploymentType = value => String(value || '').split('_').filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Full Time';

export const createHiringService = (models, { sendMail, createOrgUser, audit, config = {} } = {}) => {
  const writeAudit = payload => audit ? audit(payload) : models.AuditLog.create({ organizationId: payload.req.user.organizationId, userId: payload.req.user?._id || payload.req.user?.userId, module: payload.module, action: payload.action, entityId: payload.entityId, before: payload.before, after: payload.after, ipAddress: payload.req.ip, userAgent: payload.req.headers?.['user-agent'] || '' });
  const sendCandidateEmail = async ({ kind, organizationId, candidate, job }) => {
    if (!candidate?.email || !sendMail) return false;
    const org = await models.Organization.findById(organizationId).select('name');
    const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate';
    const companyName = org?.name || 'Our Company';
    const jobTitle = kind === 'offer' ? job?.title || 'Position' : job?.title || 'the role';
    if (kind === 'offer') {
      const expectedCTC = Number(candidate.expectedCTC || 0) > 0 ? `INR ${Number(candidate.expectedCTC).toLocaleString('en-IN')} per annum` : 'As discussed';
      return sendMail('offerLetter', candidateName, `Offer Letter - ${jobTitle}`, { candidateName, jobTitle, companyName, location: job?.location || 'As discussed', employmentType: formatEmploymentType(job?.employmentType), expectedCTC, hrEmail: config.hrContactEmail || config.smtpUser || '', portalUrl: config.frontendLoginUrl || '' }, candidate.email);
    }
    return sendMail('candidateRejection', candidateName, `Application Update - ${jobTitle}`, { candidateName, companyName, jobTitle, hrEmail: config.hrContactEmail || config.smtpUser || '' }, candidate.email);
  };
  const resolveEmployee = async ({ organizationId, employeeId, label }) => {
    if (!employeeId) return null;
    const employee = await models.Employee.findOne({ _id: employeeId, organizationId, status: 'active' }).select('_id');
    if (!employee) throw httpError(400, `${label} employee not found`);
    return employee._id;
  };
  const assertJobExists = async ({ organizationId, jobId }) => {
    const job = await models.HiringJob.findOne({ _id: jobId, organizationId }).select('_id status');
    if (!job) throw httpError(400, 'Job not found');
    return job;
  };
  const auditRow = (req, module, action, row, before) => writeAudit({ req, module, action, entityId: row._id, ...(before ? { before } : {}), after: row.toObject() });

  return {
    async createJob(req) {
      const organizationId = req.user.organizationId; const titleKey = toKey(req.body.title);
      if (await models.HiringJob.findOne({ organizationId, titleKey }).select('_id')) throw httpError(409, 'Job title already exists');
      const row = await models.HiringJob.create({ organizationId, title: req.body.title, titleKey, department: req.body.department || '', employmentType: req.body.employmentType || 'full_time', location: req.body.location || '', openings: Number(req.body.openings || 1), description: req.body.description || '', status: req.body.status || 'open', createdBy: req.user.userId, updatedBy: req.user.userId });
      await auditRow(req, 'hiring', 'JOB_CREATE', row);
      return row;
    },
    async listJobs(req) {
      const query = { organizationId: req.user.organizationId };
      if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
      if (req.query.search) { const search = String(req.query.search).trim(); query.$or = [{ title: { $regex: search, $options: 'i' } }, { department: { $regex: search, $options: 'i' } }, { location: { $regex: search, $options: 'i' } }]; }
      return models.HiringJob.find(query).sort({ createdAt: -1 }).lean();
    },
    async updateJob(req) {
      const row = await models.HiringJob.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Job not found');
      const before = row.toObject();
      if (req.body.title !== undefined) {
        const titleKey = toKey(req.body.title);
        if (await models.HiringJob.findOne({ _id: { $ne: row._id }, organizationId: req.user.organizationId, titleKey }).select('_id')) throw httpError(409, 'Job title already exists');
        row.title = req.body.title; row.titleKey = titleKey;
      }
      if (req.body.department !== undefined) row.department = req.body.department || '';
      if (req.body.employmentType !== undefined) row.employmentType = req.body.employmentType;
      if (req.body.location !== undefined) row.location = req.body.location || '';
      if (req.body.openings !== undefined) row.openings = Number(req.body.openings || 1);
      if (req.body.description !== undefined) row.description = req.body.description || '';
      if (req.body.status !== undefined) row.status = req.body.status;
      row.updatedBy = req.user.userId; await row.save(); await auditRow(req, 'hiring', 'JOB_UPDATE', row, before); return row;
    },
    async removeJob(req) {
      const row = await models.HiringJob.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Job not found');
      const before = row.toObject(); row.isDeleted = true; row.deletedAt = new Date(); row.deletedBy = req.user.userId; row.updatedBy = req.user.userId; await row.save();
      await models.HiringCandidate.updateMany({ organizationId: req.user.organizationId, jobId: row._id }, { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.userId, updatedBy: req.user.userId } });
      await auditRow(req, 'hiring', 'JOB_DELETE', row, before);
    },
    async createCandidate(req) {
      const organizationId = req.user.organizationId; const stage = req.body.stage || 'applied';
      await assertJobExists({ organizationId, jobId: req.body.jobId });
      const email = String(req.body.email || '').toLowerCase().trim();
      if (await models.HiringCandidate.findOne({ organizationId, jobId: req.body.jobId, email }).select('_id')) throw httpError(409, 'Candidate already exists for this job');
      const assignedTo = await resolveEmployee({ organizationId, employeeId: req.body.assignedTo || null, label: 'Assigned' });
      const futureConsideration = req.body.futureConsideration !== undefined ? Boolean(req.body.futureConsideration) : true;
      const row = await models.HiringCandidate.create({ organizationId, jobId: req.body.jobId, firstName: req.body.firstName, lastName: req.body.lastName || '', email, phone: req.body.phone || '', source: req.body.source || 'direct', resumeUrl: req.body.resumeUrl || '', yearsExperience: Number(req.body.yearsExperience || 0), currentLocation: req.body.currentLocation || '', preferredLocation: req.body.preferredLocation || '', highestQualification: req.body.highestQualification || '', specialization: req.body.specialization || '', collegeName: req.body.collegeName || '', graduationYear: req.body.graduationYear || null, keySkills: normalizeSkills(req.body.keySkills), linkedInUrl: req.body.linkedInUrl || '', portfolioUrl: req.body.portfolioUrl || '', currentCompany: req.body.currentCompany || '', currentCTC: Number(req.body.currentCTC || 0), expectedCTC: Number(req.body.expectedCTC || 0), noticePeriodDays: Number(req.body.noticePeriodDays || 0), futureConsideration, nextFollowUpAt: req.body.nextFollowUpAt || null, lastRejectedAt: stage === 'rejected' ? new Date() : null, stage, status: req.body.status || normalizeCandidateStatusByStage(stage, futureConsideration), assignedTo, rating: Number(req.body.rating || 0), remarks: req.body.remarks || '', interviewNotes: req.body.interviewNotes || '', stageTimeline: [{ stage, changedBy: req.user.userId, note: 'Initial stage' }], createdBy: req.user.userId, updatedBy: req.user.userId });
      await auditRow(req, 'hiring', 'CANDIDATE_CREATE', row); return row;
    },
    async listCandidates(req) {
      const query = { organizationId: req.user.organizationId };
      if (req.query.jobId) query.jobId = req.query.jobId;
      if (req.query.stage && req.query.stage !== 'all') query.stage = req.query.stage;
      if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
      if (req.query.search) { const search = String(req.query.search).trim(); query.$or = [{ firstName: { $regex: search, $options: 'i' } }, { lastName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }, { keySkills: { $regex: search, $options: 'i' } }]; }
      return models.HiringCandidate.find(query).populate('jobId', 'title status').populate('assignedTo', 'firstName lastName employeeCode').populate('interviews.interviewerEmployeeId', 'firstName lastName employeeCode').sort({ createdAt: -1 }).lean();
    },
    async updateCandidate(req) {
      const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      const before = row.toObject();
      if (req.body.jobId !== undefined && String(req.body.jobId) !== String(row.jobId)) {
        await assertJobExists({ organizationId: req.user.organizationId, jobId: req.body.jobId });
        const email = String(req.body.email || row.email).toLowerCase().trim();
        if (await models.HiringCandidate.findOne({ _id: { $ne: row._id }, organizationId: req.user.organizationId, jobId: req.body.jobId, email }).select('_id')) throw httpError(409, 'Candidate already exists for this job');
        row.jobId = req.body.jobId;
      }
      for (const field of ['firstName','lastName','email','phone','source','resumeUrl','yearsExperience','currentLocation','preferredLocation','highestQualification','specialization','collegeName','graduationYear','keySkills','linkedInUrl','portfolioUrl','currentCompany','currentCTC','expectedCTC','noticePeriodDays','futureConsideration','nextFollowUpAt','rating','remarks','interviewNotes','status']) {
        if (req.body[field] === undefined) continue;
        const value = req.body[field];
        if (field === 'email') row.email = String(value || '').toLowerCase().trim();
        else if (field === 'keySkills') row.keySkills = normalizeSkills(value);
        else if (field === 'lastName' || field === 'phone' || field === 'source' || field === 'resumeUrl' || field === 'currentLocation' || field === 'preferredLocation' || field === 'highestQualification' || field === 'specialization' || field === 'collegeName' || field === 'linkedInUrl' || field === 'portfolioUrl' || field === 'currentCompany' || field === 'remarks' || field === 'interviewNotes') row[field] = value || '';
        else if (field === 'graduationYear' || field === 'nextFollowUpAt') row[field] = value || null;
        else if (field === 'yearsExperience' || field === 'currentCTC' || field === 'expectedCTC' || field === 'noticePeriodDays' || field === 'rating') row[field] = Number(value || 0);
        else if (field === 'futureConsideration') row[field] = Boolean(value);
        else row[field] = value;
      }
      if (req.body.stage !== undefined && req.body.stage !== row.stage) {
        row.stage = req.body.stage; row.stageTimeline = row.stageTimeline || []; row.stageTimeline.push({ stage: req.body.stage, changedBy: req.user.userId, note: 'Stage updated' });
        if (req.body.status === undefined) row.status = normalizeCandidateStatusByStage(req.body.stage, row.futureConsideration);
        if (req.body.stage === 'rejected') row.lastRejectedAt = new Date();
      }
      if (req.body.assignedTo !== undefined) row.assignedTo = await resolveEmployee({ organizationId: req.user.organizationId, employeeId: req.body.assignedTo || null, label: 'Assigned' });
      row.updatedBy = req.user.userId; await row.save(); await auditRow(req, 'hiring', 'CANDIDATE_UPDATE', row, before); return row;
    },
    async updateCandidateStage(req) {
      const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      const before = row.toObject(); row.stage = req.body.stage; row.status = normalizeCandidateStatusByStage(req.body.stage, row.futureConsideration); if (req.body.stage === 'rejected') row.lastRejectedAt = new Date(); row.stageTimeline = row.stageTimeline || []; row.stageTimeline.push({ stage: req.body.stage, changedBy: req.user.userId, note: req.body.note || '' }); row.updatedBy = req.user.userId; await row.save(); await auditRow(req, 'hiring', 'CANDIDATE_STAGE_UPDATE', row, before); return row;
    },
    async releaseOfferLetter(req) {
      const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      if (row.stage !== 'offer') throw httpError(400, 'Offer letter can be released only for candidates in offer stage');
      const job = await models.HiringJob.findById(row.jobId).select('title location employmentType');
      if (!await sendCandidateEmail({ kind: 'offer', organizationId: req.user.organizationId, candidate: row, job })) throw httpError(500, 'Failed to send offer letter email');
      const before = row.toObject(); row.offerLetterReleasedAt = new Date(); row.offerLetterReleasedBy = req.user.userId; row.updatedBy = req.user.userId; row.stageTimeline = row.stageTimeline || []; row.stageTimeline.push({ stage: 'offer', changedBy: req.user.userId, note: req.body.note || 'Offer letter released' }); await row.save(); await auditRow(req, 'hiring', 'OFFER_LETTER_RELEASE', row, before); return row;
    },
    async sendRejectionEmail(req) {
      const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      if (row.stage !== 'rejected') throw httpError(400, 'Rejection email can be sent only for candidates in rejected stage');
      const job = await models.HiringJob.findById(row.jobId).select('title');
      if (!await sendCandidateEmail({ kind: 'rejection', organizationId: req.user.organizationId, candidate: row, job })) throw httpError(500, 'Failed to send rejection email');
      const before = row.toObject(); row.rejectionEmailSentAt = new Date(); row.rejectionEmailSentBy = req.user.userId; row.updatedBy = req.user.userId; row.stageTimeline = row.stageTimeline || []; row.stageTimeline.push({ stage: 'rejected', changedBy: req.user.userId, note: req.body.note || 'Rejection email sent' }); await row.save(); await auditRow(req, 'hiring', 'REJECTION_EMAIL_SEND', row, before); return row;
    },
    async convertCandidateToEmployee(req) {
      const organizationId = req.user.organizationId; const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      if (row.stage !== 'hired') throw httpError(400, 'Only hired candidates can be converted to employees');
      if (row.convertedToEmployeeId) throw httpError(409, 'Candidate is already converted to employee');
      const before = row.toObject(); const firstName = String(row.firstName || '').trim(); const lastName = String(row.lastName || '').trim() || 'Candidate'; const email = String(row.email || '').toLowerCase().trim();
      if (!firstName || !email) throw httpError(400, 'Candidate first name and email are required for conversion');
      if (!createOrgUser) throw httpError(503, 'Employee conversion is unavailable');
      const createdUser = await createOrgUser({ email, password: req.body.password, roleIds: req.body.roleIds, firstName, lastName, departmentId: req.body.departmentId, designationId: req.body.designationId, employmentType: req.body.employmentType, dateOfJoining: req.body.dateOfJoining, managerId: req.body.managerId || undefined, shiftId: req.body.shiftId || undefined, creator: req.user });
      const employee = await models.Employee.findOne({ organizationId, userId: createdUser.userId }).select('_id');
      row.convertedToEmployeeId = employee?._id || null; row.convertedAt = new Date(); row.convertedBy = req.user.userId; row.updatedBy = req.user.userId; row.stageTimeline = row.stageTimeline || []; row.stageTimeline.push({ stage: 'hired', changedBy: req.user.userId, note: 'Converted to employee' }); await row.save(); await auditRow(req, 'hiring', 'CANDIDATE_CONVERT_TO_EMPLOYEE', row, before);
      return { candidateId: row._id, employeeId: row.convertedToEmployeeId, userId: createdUser.userId, email: createdUser.email };
    },
    async scheduleInterview(req) {
      const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      if (['hired','rejected'].includes(row.stage)) throw httpError(400, 'Interview cannot be scheduled for this candidate stage');
      const interviewerEmployeeId = await resolveEmployee({ organizationId: req.user.organizationId, employeeId: req.body.interviewerEmployeeId || null, label: 'Interviewer' });
      const before = row.toObject(); row.interviews = row.interviews || []; row.interviews.push({ roundName: req.body.roundName || 'L1', interviewerEmployeeId, scheduledAt: new Date(req.body.scheduledAt), mode: req.body.mode || 'virtual', meetingLink: req.body.meetingLink || '', status: 'scheduled', createdBy: req.user.userId, updatedBy: req.user.userId }); row.updatedBy = req.user.userId; await row.save(); await auditRow(req, 'hiring', 'INTERVIEW_SCHEDULE', row, before); return row;
    },
    async submitInterviewFeedback(req) {
      const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      const interview = (row.interviews || []).id(req.params.interviewId);
      if (!interview) throw httpError(404, 'Interview not found');
      const before = row.toObject(); interview.feedback = req.body.feedback || ''; interview.scorecard = { communication: req.body.communication ?? interview.scorecard?.communication ?? null, technical: req.body.technical ?? interview.scorecard?.technical ?? null, problemSolving: req.body.problemSolving ?? interview.scorecard?.problemSolving ?? null, cultureFit: req.body.cultureFit ?? interview.scorecard?.cultureFit ?? null, overall: req.body.overall ?? interview.scorecard?.overall ?? null }; interview.recommendation = req.body.recommendation ?? interview.recommendation ?? null; interview.status = req.body.status || 'completed'; interview.updatedBy = req.user.userId; row.updatedBy = req.user.userId; await row.save(); await auditRow(req, 'hiring', 'INTERVIEW_FEEDBACK_SUBMIT', row, before); return row;
    },
    async removeCandidate(req) {
      const row = await models.HiringCandidate.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
      if (!row) throw httpError(404, 'Candidate not found');
      const before = row.toObject(); row.isDeleted = true; row.deletedAt = new Date(); row.deletedBy = req.user.userId; row.updatedBy = req.user.userId; await row.save(); await auditRow(req, 'hiring', 'CANDIDATE_DELETE', row, before);
    },
    async getOverview(req) {
      const organizationId = req.user.organizationId;
      const [totalJobs, openJobs, totalCandidates, stageBreakdown] = await Promise.all([models.HiringJob.countDocuments({ organizationId }), models.HiringJob.countDocuments({ organizationId, status: 'open' }), models.HiringCandidate.countDocuments({ organizationId }), models.HiringCandidate.aggregate([{ $match: { organizationId, isDeleted: false } }, { $group: { _id: '$stage', count: { $sum: 1 } } }])]);
      const stageMap = { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
      for (const item of stageBreakdown || []) if (item?._id && stageMap[item._id] !== undefined) stageMap[item._id] = Number(item.count || 0);
      return { totalJobs, openJobs, totalCandidates, stageBreakdown: stageMap };
    },
    async listEmployees(req) { return models.Employee.find({ organizationId: req.user.organizationId, status: 'active' }).select('_id firstName lastName employeeCode').sort({ firstName: 1, lastName: 1 }).lean(); },
  };
};
