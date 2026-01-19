/**
 * Client Admin API Functions
 */

import axiosInstance from './axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from './config';

// Authentication
export const login = (credentials) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LOGIN, credentials);
export const register = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.REGISTER, data);
export const logout = () => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LOGOUT);
export const forgotPassword = (email) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.FORGOT_PASSWORD, { email });
export const resetPassword = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.RESET_PASSWORD, data);

// Organization
export const getOrganization = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ORGANIZATION);
export const updateOrganization = (data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.ORGANIZATION, data);

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
export const updateDesignation = (id, data) => axiosInstance.put(CLIENTADMIN_ENDPOINTS.DESIGNATION_DETAIL(id), data);
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
export const clockIn = () => axiosInstance.post(CLIENTADMIN_ENDPOINTS.CLOCK_IN);
export const clockOut = () => axiosInstance.post(CLIENTADMIN_ENDPOINTS.CLOCK_OUT);
export const getAttendanceReport = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ATTENDANCE_REPORT, { params });
export const getAllHolidays = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.HOLIDAYS);
export const createHoliday = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.HOLIDAYS, data);

// Leave Management
export const getAllLeaves = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVES, { params });
export const getLeaveById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVE_DETAIL(id));
export const applyLeave = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LEAVES, data);
export const approveLeave = (id) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LEAVE_APPROVE(id));
export const rejectLeave = (id, reason) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.LEAVE_REJECT(id), { reason });
export const getLeaveTypes = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVE_TYPES);
export const getLeaveBalance = (employeeId) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.LEAVE_BALANCE, { params: { employee_id: employeeId } });

// Payroll
export const getAllPayroll = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYROLL, { params });
export const runPayroll = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.PAYROLL_RUN, data);
export const getAllPayslips = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYSLIPS, { params });
export const getPayslipById = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYSLIP_DETAIL(id));
export const downloadPayslip = (id) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.PAYSLIP_DETAIL(id), { responseType: 'blob' });
export const getSalaryComponents = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.SALARY_COMPONENTS);

// Reports
export const getAttendanceReports = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REPORTS_ATTENDANCE, { params });
export const getPayrollReports = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REPORTS_PAYROLL, { params });
export const getLeaveReports = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REPORTS_LEAVE, { params });
export const getEmployeeReports = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.REPORTS_EMPLOYEE, { params });

// HRMS
export const getAllAnnouncements = () => axiosInstance.get(CLIENTADMIN_ENDPOINTS.ANNOUNCEMENTS);
export const createAnnouncement = (data) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.ANNOUNCEMENTS, data);
export const getAllDocuments = (params) => axiosInstance.get(CLIENTADMIN_ENDPOINTS.DOCUMENTS, { params });
export const uploadDocument = (formData) => axiosInstance.post(CLIENTADMIN_ENDPOINTS.DOCUMENTS, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
