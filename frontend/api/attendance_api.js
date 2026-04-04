/**
 * Attendance API Service
 * Handles all attendance-related API calls
 */

import axiosInstance from './axiosInstance';

const API_BASE = '/attendance';

export const attendanceApi = {
  // ============ ATTENDANCE REQUESTS ============

  /**
   * Get all attendance regularization requests
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getRegularizationRequests: (params = {}) =>
    axiosInstance.get(`${API_BASE}/regularization/`, { params }),

  /**
   * Get pending regularization requests
   * @returns {Promise}
   */
  getPendingRequests: () =>
    axiosInstance.get(`${API_BASE}/regularization/pending/`),

  /**
   * Get single regularization request
   * @param {string} id - Request ID
   * @returns {Promise}
   */
  getRegularizationRequest: (id) =>
    axiosInstance.get(`${API_BASE}/regularization/${id}/`),

  /**
   * Create new regularization request
   * @param {Object} data - Request data
   * @returns {Promise}
   */
  createRegularizationRequest: (data) =>
    axiosInstance.post(`${API_BASE}/regularization/`, data),

  /**
   * Update regularization request
   * @param {string} id - Request ID
   * @param {Object} data - Updated data
   * @returns {Promise}
   */
  updateRegularizationRequest: (id, data) =>
    axiosInstance.put(`${API_BASE}/regularization/${id}/`, data),

  /**
   * Delete regularization request
   * @param {string} id - Request ID
   * @returns {Promise}
   */
  deleteRegularizationRequest: (id) =>
    axiosInstance.delete(`${API_BASE}/regularization/${id}/`),

  /**
   * Approve regularization request
   * @param {string} id - Request ID
   * @param {Object} data - Comments and additional data
   * @returns {Promise}
   */
  approveRequest: (id, data = {}) =>
    axiosInstance.post(`${API_BASE}/regularization/${id}/approve/`, data),

  /**
   * Reject regularization request
   * @param {string} id - Request ID
   * @param {Object} data - Comments and additional data
   * @returns {Promise}
   */
  rejectRequest: (id, data = {}) =>
    axiosInstance.post(`${API_BASE}/regularization/${id}/reject/`, data),

  // ============ ATTENDANCE RECORDS ============

  /**
   * Get attendance records with filters
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getAttendanceRecords: (params = {}) =>
    axiosInstance.get(`${API_BASE}/`, { params }),

  /**
   * Get attendance to validate
   * @returns {Promise}
   */
  getAttendanceToValidate: () =>
    axiosInstance.get(`${API_BASE}/to-validate/`),

  /**
   * Validate attendance record
   * @param {Object} data - Attendance ID and validation data
   * @returns {Promise}
   */
  validateAttendance: (data) =>
    axiosInstance.post(`${API_BASE}/to-validate/`, data),

  /**
   * Check in employee
   * @param {Object} data - Employee ID and check-in data
   * @returns {Promise}
   */
  checkIn: (data) =>
    axiosInstance.post(`${API_BASE}/check-in/`, data),

  /**
   * Check out employee
   * @param {Object} data - Employee ID and check-out data
   * @returns {Promise}
   */
  checkOut: (data) =>
    axiosInstance.post(`${API_BASE}/check-out/`, data),

  /**
   * Get employee monthly attendance
   * @param {string} employeeId - Employee ID
   * @param {number} month - Month
   * @param {number} year - Year
   * @returns {Promise}
   */
  getEmployeeMonthlyAttendance: (employeeId, month, year) =>
    axiosInstance.get(`${API_BASE}/employee-monthly/`, {
      params: { employee: employeeId, month, year }
    }),

  /**
   * Get daily attendance summary
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise}
   */
  getDailySummary: (date) =>
    axiosInstance.get(`${API_BASE}/daily-summary/`, { params: { date } }),

  /**
   * Get dashboard statistics (Total staff, Attendance %, counts)
   * @param {string} date - Optional date
   * @returns {Promise}
   */
  getDashboardStats: (date) =>
    axiosInstance.get(`${API_BASE}/dashboard-stats/`, { params: { date } }),

  /**
   * Get offline employees today
   * @param {Object} params - page, page_size
   * @returns {Promise}
   */
  getOfflineEmployees: (params = {}) =>
    axiosInstance.get(`${API_BASE}/offline-employees/`, { params }),

  /**
   * Get employees currently on break
   * @returns {Promise}
   */
  getOnBreakEmployees: () =>
    axiosInstance.get(`${API_BASE}/on-break/`),

  /**
   * Get weekly analytics percentages
   * @param {string} period - Day, Week, Month
   * @returns {Promise}
   */
  getAnalyticsData: (period = 'Day') =>
    axiosInstance.get(`${API_BASE}/analytics/`, { params: { period } }),

  /**
   * Get overtime hours by department
   * @param {Object} params - month, year
   * @returns {Promise}
   */
  getDepartmentOvertime: (params = {}) =>
    axiosInstance.get(`${API_BASE}/department-overtime/`, { params }),

  /**
   * Get employee dashboard data (for Profile or Personal Dashboard)
   * @param {Object} params - month, year, employee_id
   * @returns {Promise}
   */
  getMyDashboard: (params = {}) =>
    axiosInstance.get(`${API_BASE}/my_dashboard/`, { params }),

  /**
   * Get monthly attendance summaries for all employees
   * @param {Object} params - month, year, employee filters
   * @returns {Promise}
   */
  getAttendanceSummaries: (params = {}) =>
    axiosInstance.get(`${API_BASE}/summaries/`, { params }),

  /**
   * Trigger generation of monthly summary for an employee
   * @param {Object} data - employee, month, year
   * @returns {Promise}
   */
  triggerSummaryGeneration: (data) =>
    axiosInstance.post(`${API_BASE}/summary/`, data),

  // ============ OVERTIME REQUESTS ============

  /**
   * Get all overtime requests
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getOvertimeRequests: (params = {}) =>
    axiosInstance.get(`${API_BASE}/overtime/`, { params }),

  /**
   * Get pending overtime requests
   * @returns {Promise}
   */
  getPendingOvertime: () =>
    axiosInstance.get(`${API_BASE}/overtime/pending/`),

  /**
   * Create new overtime request
   * @param {Object} data - Request data
   * @returns {Promise}
   */
  createOvertimeRequest: (data) =>
    axiosInstance.post(`${API_BASE}/overtime/`, data),

  /**
   * Approve overtime request
   * @param {string} id - Request ID
   * @param {Object} data - Comments
   * @returns {Promise}
   */
  approveOvertime: (id, data = {}) =>
    axiosInstance.post(`${API_BASE}/overtime/${id}/approve/`, data),

  /**
   * Reject overtime request
   * @param {string} id - Request ID
   * @param {Object} data - Comments
   * @returns {Promise}
   */
  rejectOvertime: (id, data = {}) =>
    axiosInstance.post(`${API_BASE}/overtime/${id}/reject/`, data),

  /**
   * Get overtime summary statistics
   * @param {Object} params - month, year
   * @returns {Promise}
   */
  getOvertimeStats: (params = {}) =>
    axiosInstance.get(`${API_BASE}/overtime/stats/`, { params }),

  /**
   * Delete overtime request
   * @param {string} id - Request ID
   * @returns {Promise}
   */
  deleteOvertimeRequest: (id) =>
    axiosInstance.delete(`${API_BASE}/overtime/${id}/`),

  // ============ SHIFTS ============

  /**
   * Get all shifts
   * @returns {Promise}
   */
  getShifts: () =>
    axiosInstance.get(`${API_BASE}/shifts/`),

  /**
   * Create new shift
   * @param {Object} data - Shift data
   * @returns {Promise}
   */
  createShift: (data) =>
    axiosInstance.post(`${API_BASE}/shifts/`, data),

  /**
   * Update shift
   * @param {string} id - Shift ID
   * @param {Object} data - Updated data
   * @returns {Promise}
   */
  updateShift: (id, data) =>
    axiosInstance.put(`${API_BASE}/shifts/${id}/`, data),

  /**
   * Delete shift
   * @param {string} id - Shift ID
   * @returns {Promise}
   */
  deleteShift: (id) =>
    axiosInstance.delete(`${API_BASE}/shifts/${id}/`),
};

export default attendanceApi;
