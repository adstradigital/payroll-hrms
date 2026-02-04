/**
 * API Configuration
 * Central config file for all API URLs
 * Toggle between Production and Local Development as needed
 */

// =============================================================================
// PRODUCTION SETTINGS (uncomment for deployment)
// =============================================================================
// const BASE_URL = 'https://yourdomain.com/api';
// export const MEDIA_URL = 'https://yourdomain.com/media';
// export const UPLOADS_URL = 'https://yourdomain.com/media/uploads';

// =============================================================================
// LOCAL DEVELOPMENT SETTINGS
// =============================================================================
const BASE_URL = 'http://127.0.0.1:8000/api';
export const MEDIA_URL = 'http://127.0.0.1:8000/media';
export const UPLOADS_URL = 'http://127.0.0.1:8000/media/uploads';

// =============================================================================
// SUPER ADMIN ENDPOINTS
// =============================================================================
export const SUPERADMIN_ENDPOINTS = {
    LOGIN: `${BASE_URL}/account/auth/super-admin/login/`,
    ORGANIZATIONS: `${BASE_URL}/organizations/`,
    ORGANIZATION_DETAIL: (id) => `${BASE_URL}/organizations/${id}/`,
    SUBSCRIPTIONS: `${BASE_URL}/subscriptions/`,
    SUBSCRIPTION_PLANS: `${BASE_URL}/subscriptions/plans/`,
    ALL_USERS: `${BASE_URL}/account/users/`,
    USER_DETAIL: (id) => `${BASE_URL}/account/users/${id}/`,
    ANALYTICS: `${BASE_URL}/reports/analytics/`,
    DASHBOARD_STATS: `${BASE_URL}/reports/dashboard-stats/`,

    // Organization Registration Approvals
    PENDING_REGISTRATIONS: `${BASE_URL}/account/registrations/`,
    REGISTRATION_DETAIL: (id) => `${BASE_URL}/account/registrations/${id}/`,
    APPROVE_REGISTRATION: (id) => `${BASE_URL}/account/registrations/${id}/approve/`,
    REJECT_REGISTRATION: (id) => `${BASE_URL}/account/registrations/${id}/reject/`,
};

// =============================================================================
// CLIENT ADMIN ENDPOINTS
// =============================================================================
export const CLIENTADMIN_ENDPOINTS = {
    // Auth
    LOGIN: `${BASE_URL}/account/auth/login/`,
    REGISTER: `${BASE_URL}/account/auth/register/`,
    SUBMIT_REGISTRATION: `${BASE_URL}/account/registrations/submit/`,
    LOGOUT: `${BASE_URL}/account/auth/logout/`,
    REFRESH_TOKEN: `${BASE_URL}/account/auth/token/refresh/`,
    FORGOT_PASSWORD: `${BASE_URL}/account/auth/forgot-password/`,
    RESET_PASSWORD: `${BASE_URL}/account/auth/reset-password/`,

    // Organization
    ORGANIZATION: `${BASE_URL}/account/organization/`,

    // Employees
    EMPLOYEES: `${BASE_URL}/account/employees/`,
    EMPLOYEE_DETAIL: (id) => `${BASE_URL}/account/employees/${id}/`,
    GET_MY_PROFILE: `${BASE_URL}/account/employees/me/`,
    DEPARTMENTS: `${BASE_URL}/account/departments/`,
    DEPARTMENT_DETAIL: (id) => `${BASE_URL}/account/departments/${id}/`,
    DESIGNATIONS: `${BASE_URL}/account/designations/`,
    DESIGNATION_DETAIL: (id) => `${BASE_URL}/account/designations/${id}/`,
    DESIGNATION_PERMISSIONS: (id) => `${BASE_URL}/account/designations/${id}/permissions/`,
    ROLES: `${BASE_URL}/account/roles/`,
    ROLE_DETAIL: (id) => `${BASE_URL}/account/roles/${id}/`,
    PERMISSIONS: `${BASE_URL}/account/permissions/`,
    SCOPES: `${BASE_URL}/account/scopes/`,
    EMPLOYEE_DOCUMENTS: (id) => `${BASE_URL}/account/employees/${id}/documents/`,
    EMPLOYEE_DOCUMENT_DETAIL: (empId, docId) => `${BASE_URL}/account/employees/${empId}/documents/${docId}/`,


    // Requests
    DOCUMENT_REQUESTS: `${BASE_URL}/account/employees/document-requests/`,
    SHIFT_REQUESTS: `${BASE_URL}/account/employees/shift-requests/`,
    WORK_TYPE_REQUESTS: `${BASE_URL}/account/employees/work-type-requests/`,
    REIMBURSEMENT_REQUESTS: `${BASE_URL}/account/employees/reimbursement-requests/`,
    REIMBURSEMENT_REQUEST_DETAIL: (id) => `${BASE_URL}/account/employees/reimbursement-requests/${id}/`,
    ENCASHMENT_REQUESTS: `${BASE_URL}/account/employees/encashment-requests/`,
    ENCASHMENT_REQUEST_DETAIL: (id) => `${BASE_URL}/account/employees/encashment-requests/${id}/`,

    // Attendance
    ATTENDANCE: `${BASE_URL}/attendance/`,
    CLOCK_IN: `${BASE_URL}/attendance/clock-in/`,
    CLOCK_OUT: `${BASE_URL}/attendance/clock-out/`,
    ATTENDANCE_REPORT: `${BASE_URL}/attendance/report/`,
    HOLIDAYS: `${BASE_URL}/attendance/holidays/`,
    SHIFTS: `${BASE_URL}/attendance/shifts/`,
    SHIFT_DETAIL: (id) => `${BASE_URL}/attendance/shifts/${id}/`,
    ATTENDANCE_POLICIES: `${BASE_URL}/attendance/policies/`,
    ATTENDANCE_POLICY_DETAIL: (id) => `${BASE_URL}/attendance/policies/${id}/`,
    SHIFT_ASSIGNMENTS: `${BASE_URL}/attendance/shift-assignments/`,

    // Leave
    LEAVES: `${BASE_URL}/leave/requests/`,
    LEAVE_DETAIL: (id) => `${BASE_URL}/leave/requests/${id}/`,
    LEAVE_TYPES: `${BASE_URL}/leave/types/`,
    LEAVE_TYPE_DETAIL: (id) => `${BASE_URL}/leave/types/${id}/`,
    LEAVE_BALANCE: `${BASE_URL}/leave/balances/`,
    LEAVE_PROCESS: (id) => `${BASE_URL}/leave/requests/${id}/process/`,

    // Payroll
    PAYROLL: `${BASE_URL}/payroll/`,
    PAYROLL_RUN: `${BASE_URL}/payroll/run/`,
    PAYSLIPS: `${BASE_URL}/payroll/payslips/`,
    PAYSLIP_DETAIL: (id) => `${BASE_URL}/payroll/payslips/${id}/`,
    PAYSLIP_DASHBOARD_STATS: `${BASE_URL}/payroll/payslips/dashboard-stats/`,
    PAYSLIP_MY_PAYSLIPS: `${BASE_URL}/payroll/payslips/my-payslips/`,
    SALARY_COMPONENTS: `${BASE_URL}/payroll/components/`,
    SALARY_COMPONENT_DETAIL: (id) => `${BASE_URL}/payroll/components/${id}/`,
    SALARY_STRUCTURES: `${BASE_URL}/payroll/structures/`,
    SALARY_STRUCTURE_DETAIL: (id) => `${BASE_URL}/payroll/structures/${id}/`,
    EMPLOYEE_SALARIES: `${BASE_URL}/payroll/employee-salaries/`,
    EMPLOYEE_SALARY_DETAIL: (id) => `${BASE_URL}/payroll/employee-salaries/${id}/`,
    EMPLOYEE_SALARY_CURRENT: `${BASE_URL}/payroll/employee-salaries/current/`,
    EMPLOYEE_SALARY_STATS: `${BASE_URL}/payroll/employee-salaries/stats/`,
    PAYROLL_PERIODS: `${BASE_URL}/payroll/periods/`,
    PAYROLL_PERIOD_DETAIL: (id) => `${BASE_URL}/payroll/periods/${id}/`,
    PAYROLL_GENERATE: `${BASE_URL}/payroll/periods/generate/`,
    PAYROLL_REPORTS: `${BASE_URL}/payroll/reports/`,

    // Reports
    REPORTS_ATTENDANCE: `${BASE_URL}/reports/attendance/`,
    REPORTS_PAYROLL: `${BASE_URL}/reports/payroll/`,
    REPORTS_LEAVE: `${BASE_URL}/reports/leave/`,
    REPORTS_EMPLOYEE: `${BASE_URL}/reports/employee/`,

    // HRMS
    ANNOUNCEMENTS: `${BASE_URL}/hrms/announcements/`,
    DOCUMENTS: `${BASE_URL}/hrms/documents/`,

    // Audit/Logs
    AUDIT_LOGS: `${BASE_URL}/audit/logs/`,
    AUDIT_LOG_DETAIL: (id) => `${BASE_URL}/audit/logs/${id}/`,

    // Security
    SECURITY_PROFILE: `${BASE_URL}/account/security/profile/`,
    SET_SECURITY_PIN: `${BASE_URL}/account/security/pin/set/`,
    VERIFY_SECURITY_PIN: `${BASE_URL}/account/security/pin/verify/`,

    // Assets
    ASSETS: `${BASE_URL}/assets/inventory/`,
    ASSET_DETAIL: (id) => `${BASE_URL}/assets/inventory/${id}/`,
    ASSET_BATCHES: `${BASE_URL}/assets/batches/`,
    ASSET_BATCH_DETAIL: (id) => `${BASE_URL}/assets/batches/${id}/`,
    ASSET_REQUESTS: `${BASE_URL}/assets/requests/`,
    ASSET_REQUEST_DETAIL: (id) => `${BASE_URL}/assets/requests/${id}/`,
    ASSET_REQUEST_PROCESS: (id) => `${BASE_URL}/assets/requests/${id}/process/`,
    ASSET_HISTORY: `${BASE_URL}/assets/history/`,
};

export default BASE_URL;
