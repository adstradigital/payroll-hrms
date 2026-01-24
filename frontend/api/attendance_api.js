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
   * Get dashboard statistics
   * @returns {Promise}
   */
  getDashboardStats: () =>
    axiosInstance.get(`${API_BASE}/dashboard-stats/`),

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
};

export default attendanceApi;
