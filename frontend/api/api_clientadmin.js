/**
 * Client Admin API Functions
 */

import axiosInstance from './axiosInstance';
export { axiosInstance as apiClient };
import { CLIENTADMIN_ENDPOINTS } from './config';

console.log('--- api_clientadmin.js v2 loaded ---');
if (typeof window !== 'undefined') window.__HOLIDAY_API_READY__ = true;

export function apiPreviewHolidays(data) {
    console.log('Calling apiPreviewHolidays with:', data);
    return axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}preview/`, data);
}

export function apiImportHolidays(data) {
    console.log('Calling apiImportHolidays with:', data);
    return axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}import/`, data);
}

export function apiDeleteAllHolidays() {
    console.log('Calling apiDeleteAllHolidays');
    return axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}delete_all/`);
}

// Authentication
export const login = (credentials) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LOGIN, credentials);
// Submit registration for approval (no password - credentials will be auto-generated)
export const register = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.SUBMIT_REGISTRATION, {
    organization_name: data.organizationName,
    admin_name: data.fullName,
    admin_email: data.email,
    admin_phone: data.phone || '',
    employee_scale: data.employeeCount || '1-50',
    is_multi_company: data.isMultiCompany || false,
    subsidiaries: data.companies ? data.companies.map(c => ({ name: c.name })) : [],
    plan: 'pro'
});
export const logout = () => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LOGOUT);
export const forgotPassword = (email) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.FORGOT_PASSWORD, { email });
export const resetPassword = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.RESET_PASSWORD, data);

// Organization
export const getOrganization = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ORGANIZATION);
export const updateOrganization = (data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.ORGANIZATION, data);
export const updateOrganizationSettings = (settings) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.ORGANIZATION, { settings });

// Employees
export const getAllEmployees = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.EMPLOYEES, { params });
export const getEmployeeById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.EMPLOYEE_DETAIL(id));
export const getMyProfile = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.GET_MY_PROFILE);
export const createEmployee = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.EMPLOYEES, data);
export const updateEmployee = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.EMPLOYEE_DETAIL(id), data);
export const deleteEmployee = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.EMPLOYEE_DETAIL(id));

// Departments & Designations
export const getAllDepartments = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.DEPARTMENTS);
export const createDepartment = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.DEPARTMENTS, data);
export const updateDepartment = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.DEPARTMENT_DETAIL(id), data);
export const deleteDepartment = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.DEPARTMENT_DETAIL(id));

export const getAllDesignations = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.DESIGNATIONS);
export const createDesignation = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.DESIGNATIONS, data);
export const updateDesignation = (id, data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.DESIGNATION_DETAIL(id), data);
export const deleteDesignation = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.DESIGNATION_DETAIL(id));
export const updateDesignationPermissions = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.DESIGNATION_PERMISSIONS(id), data);

export const getRoles = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ROLES);
export const createRole = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ROLES, data);
export const updateRole = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.ROLE_DETAIL(id), data);
export const deleteRole = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.ROLE_DETAIL(id));
export const getPermissions = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PERMISSIONS);
export const getScopes = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SCOPES);

// Attendance
export const getAllAttendance = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ATTENDANCE, { params });
export const createAttendance = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ATTENDANCE, data);
export const updateAttendance = (id, data) => axiosInstance.put(`${CLIENTADMIN_ENDPOINTS.ATTENDANCE}${id}/`, data);
export const bulkMarkAttendance = (data) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.ATTENDANCE}bulk-mark/`, data);
export const clockIn = () => axiosInstance.post(CLIENTADMIN_ENDPOINTS.CLOCK_IN);
export const clockOut = () => axiosInstance.post(CLIENTADMIN_ENDPOINTS.CLOCK_OUT);
export const getAttendanceReport = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ATTENDANCE_REPORT, { params });
export const getAllHolidays = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.HOLIDAYS);
export const createHoliday = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.HOLIDAYS, data);
export const updateHoliday = (id, data) => axiosInstance.put(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}${id}/`, data);
export const deleteHoliday = (id) => axiosInstance.delete(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}${id}/`);
export const restoreHoliday = (id) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}${id}/restore/`);
export const getDeletedHolidays = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.HOLIDAYS, { params: { include_deleted: 'true', is_active: 'false' } });

// Leave Management
export const getAllLeaves = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVES, { params });
export const getLeaveById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVE_DETAIL(id));
export const applyLeave = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LEAVES, data);
export const getLeaveStats = (params) => axiosInstance.get(`${CLIENTADMIN_ENDPOINTS.LEAVES}stats/`, { params });
export const cancelLeave = (id) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.LEAVES}${id}/cancel/`);
export const approveLeave = (id, approverId) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LEAVE_PROCESS(id), { action: 'approve', approver_id: approverId });
export const rejectLeave = (id, reason) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LEAVE_PROCESS(id), { action: 'reject', rejection_reason: reason });
export const getLeaveTypes = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVE_TYPES);
export const getLeaveBalance = (employeeId) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVE_BALANCE, { params: { employee_id: employeeId } });
export const createLeaveType = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LEAVE_TYPES, data);
export const updateLeaveType = (id, data) => axiosInstance.put(`${CLIENTADMIN_ENDPOINTS.LEAVE_TYPES}${id}/`, data);
export const deleteLeaveType = (id) => axiosInstance.delete(`${CLIENTADMIN_ENDPOINTS.LEAVE_TYPES}${id}/`);
export const allocateLeaves = (data) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.LEAVE_BALANCE}allocate/`, data);
export const runLeaveAccrual = (companyId) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.LEAVE_BALANCE}run_accrual/`, { company: companyId });
export const getAllLeaveBalances = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVE_BALANCE, { params });

// Payroll
export const getAllPayroll = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYROLL, { params });
export const runPayroll = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.PAYROLL_RUN, data);
export const getAllPayslips = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYSLIPS, { params });
export const getPayslipById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYSLIP_DETAIL(id));
export const downloadPayslip = (id) => axiosInstance.get(`${CLIENTADMIN_ENDPOINTS.PAYSLIPS}${id}/download/`, {
    responseType: 'blob'
});
export const getPayslipDashboardStats = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYSLIP_DASHBOARD_STATS, { params });
export const getMyPayslips = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYSLIP_MY_PAYSLIPS);
export const addPayslipComponent = (id, data) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.PAYSLIPS}${id}/add-component/`, data);
export const removePayslipComponent = (id, componentId) => axiosInstance.delete(`${CLIENTADMIN_ENDPOINTS.PAYSLIPS}${id}/components/${componentId}/`);

// Tax Management
export const getTaxSlabs = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.TAX_SLABS, { params });
export const createTaxSlab = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.TAX_SLABS, data);
export const updateTaxSlab = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.TAX_SLAB_DETAIL(id), data);
export const deleteTaxSlab = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.TAX_SLAB_DETAIL(id));

export const getTaxDeclarations = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.TAX_DECLARATIONS, { params });
export const updateTaxDeclaration = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.TAX_DECLARATION_DETAIL(id), data);
export const getTaxDashboardStats = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.TAX_DASHBOARD_STATS);


// Salary Components
export const getSalaryComponents = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SALARY_COMPONENTS, { params });
export const getSalaryComponentById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SALARY_COMPONENT_DETAIL(id));
export const createSalaryComponent = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.SALARY_COMPONENTS, data);
export const updateSalaryComponent = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.SALARY_COMPONENT_DETAIL(id), data);
export const deleteSalaryComponent = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.SALARY_COMPONENT_DETAIL(id));

// Salary Structures

export const getSalaryStructures = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SALARY_STRUCTURES, { params });
export const getSalaryStructureById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SALARY_STRUCTURE_DETAIL(id));
export const createSalaryStructure = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.SALARY_STRUCTURES, data);
export const updateSalaryStructure = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.SALARY_STRUCTURE_DETAIL(id), data);
export const deleteSalaryStructure = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.SALARY_STRUCTURE_DETAIL(id));
export const addComponentToStructure = (id, data) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.SALARY_STRUCTURE_DETAIL(id)}add-component/`, data);
export const updateSalaryStructureComponents = (id, data) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.SALARY_STRUCTURE_DETAIL(id)}update_components/`, data);

// Employee Salaries
export const getEmployeeSalaries = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.EMPLOYEE_SALARIES, { params });
export const getEmployeeSalaryById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.EMPLOYEE_SALARY_DETAIL(id));
export const createEmployeeSalary = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.EMPLOYEE_SALARIES, data);
export const updateEmployeeSalary = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.EMPLOYEE_SALARY_DETAIL(id), data);
export const deleteEmployeeSalary = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.EMPLOYEE_SALARY_DETAIL(id));
export const getCurrentEmployeeSalary = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.EMPLOYEE_SALARY_CURRENT, { params });
export const getEmployeeSalaryStats = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.EMPLOYEE_SALARY_STATS, { params });

// Loans & Advances
export const getLoans = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LOANS, { params });
export const getLoanById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LOAN_DETAIL(id));
export const createLoan = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LOANS, data);
export const updateLoan = (id, data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.LOAN_DETAIL(id), data);
export const deleteLoan = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.LOAN_DETAIL(id));
export const generateLoanSchedule = (id) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LOAN_GENERATE_SCHEDULE(id));

// Advance Salary
export const getAdvances = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ADVANCES, { params });
export const getAdvanceById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ADVANCE_DETAIL(id));
export const createAdvance = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ADVANCES, data);
export const updateAdvance = (id, data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.ADVANCE_DETAIL(id), data);
export const deleteAdvance = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.ADVANCE_DETAIL(id));
export const getAdvanceStats = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ADVANCE_STATS);

// Payroll Settings
export const getPayrollSettings = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYROLL_SETTINGS);
export const updatePayrollSettings = (data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.PAYROLL_SETTINGS, data);

// Payroll Periods
export const getPayrollPeriods = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYROLL_PERIODS, { params });
export const getPayrollPeriodById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYROLL_PERIOD_DETAIL(id));
export const createPayrollPeriod = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.PAYROLL_PERIODS, data);
export const updatePayrollPeriod = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.PAYROLL_PERIOD_DETAIL(id), data);
export const deletePayrollPeriod = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.PAYROLL_PERIOD_DETAIL(id)); // Added delete function
export const generatePayrollForPeriod = (data) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.PAYROLL_PERIODS}generate/`, data);
export const markPeriodAsPaid = (id) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.PAYROLL_PERIOD_DETAIL(id)}mark-paid/`);
export const generateAdvancedPayroll = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.PAYROLL_GENERATE, data);
export const getPayrollReportData = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYROLL_REPORTS, { params });

// Reports
export const getAttendanceReports = ({ type, ...params }) => axiosInstance.get(`${CLIENTADMIN_ENDPOINTS.REPORTS_ATTENDANCE}${type}/`, { params });
export const getPayrollReports = ({ type, ...params }) => axiosInstance.get(`${CLIENTADMIN_ENDPOINTS.REPORTS_PAYROLL}${type}/`, { params });
export const getLeaveReports = ({ type, ...params }) => axiosInstance.get(`${CLIENTADMIN_ENDPOINTS.REPORTS_LEAVE}${type}/`, { params });
export const getEmployeeReports = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REPORTS_EMPLOYEE, { params });

// Requests
export const getDocumentRequests = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.DOCUMENT_REQUESTS, { params });
export const createDocumentRequest = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.DOCUMENT_REQUESTS, data);
export const approveDocumentRequest = (id) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.DOCUMENT_REQUESTS}${id}/approve/`);
export const rejectDocumentRequest = (id, reason) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.DOCUMENT_REQUESTS}${id}/reject/`, { reason });
export const submitDocumentForRequest = (id, formData) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.DOCUMENT_REQUESTS}${id}/submit/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getShiftRequests = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SHIFT_REQUESTS, { params });
export const createShiftRequest = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.SHIFT_REQUESTS, data);

export const getWorkTypeRequests = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.WORK_TYPE_REQUESTS, { params });
export const createWorkTypeRequest = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.WORK_TYPE_REQUESTS, data);

export const getReimbursementRequests = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REIMBURSEMENT_REQUESTS, { params });
export const createReimbursementRequest = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.REIMBURSEMENT_REQUESTS, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateReimbursementRequest = (id, data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.REIMBURSEMENT_REQUEST_DETAIL(id), data);
export const deleteReimbursementRequest = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.REIMBURSEMENT_REQUEST_DETAIL(id));

export const getEncashmentRequests = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ENCASHMENT_REQUESTS, { params });
export const createEncashmentRequest = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ENCASHMENT_REQUESTS, data);
export const updateEncashmentRequest = (id, data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.ENCASHMENT_REQUEST_DETAIL(id), data);
export const deleteEncashmentRequest = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.ENCASHMENT_REQUEST_DETAIL(id));

// HRMS
export const getAllAnnouncements = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ANNOUNCEMENTS);
export const createAnnouncement = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ANNOUNCEMENTS, data);
export const getAllDocuments = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.DOCUMENTS, { params });
export const uploadDocument = (formData) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.DOCUMENTS, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Employee Documents
export const getEmployeeDocuments = (employeeId) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.EMPLOYEE_DOCUMENTS(employeeId));
export const uploadEmployeeDocument = (employeeId, data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.EMPLOYEE_DOCUMENTS(employeeId), data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteEmployeeDocument = (employeeId, docId) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.EMPLOYEE_DOCUMENT_DETAIL(employeeId, docId));

// Security
export const getSecurityProfile = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SECURITY_PROFILE);
export const updateSecurityProfile = (data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.SECURITY_PROFILE, data);
export const setSecurityPin = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.SET_SECURITY_PIN, data);
export const verifySecurityPin = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.VERIFY_SECURITY_PIN, data);

// Assets
export const getAssets = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ASSETS, { params });
export const getAssetById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ASSET_DETAIL(id));
export const createAsset = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ASSETS, data);
export const updateAsset = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.ASSET_DETAIL(id), data);
export const deleteAsset = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.ASSET_DETAIL(id));
export const allocateAsset = (id, data) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.ASSET_DETAIL(id)}allocate/`, data);
export const deallocateAsset = (id) => axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.ASSET_DETAIL(id)}deallocate/`);

export const getAssetBatches = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ASSET_BATCHES, { params });
export const createAssetBatch = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ASSET_BATCHES, data);
export const updateAssetBatch = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.ASSET_BATCH_DETAIL(id), data);
export const deleteAssetBatch = (id) => axiosInstance.delete(CLIENTADMIN_ENDPOINTS.ASSET_BATCH_DETAIL(id));

export const getAssetRequests = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ASSET_REQUESTS, { params });
export const createAssetRequest = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ASSET_REQUESTS, data);
export const processAssetRequest = (id, data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ASSET_REQUEST_PROCESS(id), data);

export const getAssetHistory = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ASSET_HISTORY, { params });
export const getAssetDashboardStats = () => axiosInstance.get(`${CLIENTADMIN_ENDPOINTS.ASSETS}dashboard_stats/`);

// Performance
export const getReviewPeriods = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REVIEW_PERIODS, { params });
export const getGoals = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.GOALS, { params });
export const getGoalById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.GOAL_DETAIL(id));
export const updateGoal = (id, data) => axiosInstance.patch(CLIENTADMIN_ENDPOINTS.GOAL_DETAIL(id), data);
export const updateGoalProgress = (id, progress) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.GOAL_UPDATE_PROGRESS(id), { progress_percentage: progress });

export const getReviews = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REVIEWS, { params });
export const getReviewById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REVIEW_DETAIL(id));
export const createReviews = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.REVIEW_BULK_CREATE, data);
export const submitSelfAssessment = (id, data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.REVIEW_SUBMIT_SELF(id), data);
export const submitManagerReview = (id, data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.REVIEW_SUBMIT_MANAGER(id), data);
export const approveReview = (id) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.REVIEW_APPROVE(id));
export const rejectReview = (id, reason) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.REVIEW_REJECT(id), { reason });
