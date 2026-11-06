import { createLeaveTypeModels } from '../leave-types/leave-type.models.js';
import { createDepartmentModels } from '../departments/department.models.js';

export const createLeaveBalanceModels = connection => ({ ...createLeaveTypeModels(connection), ...createDepartmentModels(connection) });
