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
    ORGANIZATIONS: `${BASE_URL}/organizations/`,
    ORGANIZATION_DETAIL: (id) => `${BASE_URL}/organizations/${id}/`,
    SUBSCRIPTIONS: `${BASE_URL}/subscriptions/`,
    SUBSCRIPTION_PLANS: `${BASE_URL}/subscriptions/plans/`,
    ALL_USERS: `${BASE_URL}/account/users/`,
    USER_DETAIL: (id) => `${BASE_URL}/account/users/${id}/`,
    ANALYTICS: `${BASE_URL}/reports/analytics/`,
    DASHBOARD_STATS: `${BASE_URL}/reports/dashboard-stats/`,
};

// =============================================================================
// CLIENT ADMIN ENDPOINTS
// =============================================================================
export const CLIENTADMIN_ENDPOINTS = {
    // Auth
    LOGIN: `${BASE_URL}/account/auth/login/`,
    REGISTER: `${BASE_URL}/account/auth/register/`,
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

    // Requests
    DOCUMENT_REQUESTS: `${BASE_URL}/account/employees/document-requests/`,
    SHIFT_REQUESTS: `${BASE_URL}/account/employees/shift-requests/`,
    WORK_TYPE_REQUESTS: `${BASE_URL}/account/employees/work-type-requests/`,

    // Attendance
    ATTENDANCE: `${BASE_URL}/attendance/`,
    CLOCK_IN: `${BASE_URL}/attendance/clock-in/`,
    CLOCK_OUT: `${BASE_URL}/attendance/clock-out/`,
    ATTENDANCE_REPORT: `${BASE_URL}/attendance/report/`,
    HOLIDAYS: `${BASE_URL}/attendance/holidays/`,

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
    SALARY_COMPONENTS: `${BASE_URL}/payroll/components/`,

    // Reports
    REPORTS_ATTENDANCE: `${BASE_URL}/reports/attendance/`,
    REPORTS_PAYROLL: `${BASE_URL}/reports/payroll/`,
    REPORTS_LEAVE: `${BASE_URL}/reports/leave/`,
    REPORTS_EMPLOYEE: `${BASE_URL}/reports/employee/`,

    // HRMS
    ANNOUNCEMENTS: `${BASE_URL}/hrms/announcements/`,
    DOCUMENTS: `${BASE_URL}/hrms/documents/`,
};

export default BASE_URL;
