/**
 * Biometric API Service
 * Handles all biometric device and log related API calls
 */

import axiosInstance from './axiosInstance';

const API_BASE = '/biometrics';

export const biometricApi = {
    /**
     * Get all registered biometric devices
     * @returns {Promise}
     */
    getDevices: () => axiosInstance.get(`${API_BASE}/devices/`),

    /**
     * Add a new biometric device
     * @param {Object} data - Device configuration
     * @returns {Promise}
     */
    addDevice: (data) => axiosInstance.post(`${API_BASE}/devices/`, data),

    /**
     * Test connection to a biometric device
     * @param {string} id - Device ID
     * @returns {Promise}
     */
    testConnection: (id) => axiosInstance.post(`${API_BASE}/devices/${id}/test_connection/`),

    /**
     * Sync logs from a biometric device
     * @param {string} id - Device ID
     * @returns {Promise}
     */
    syncLogs: (id) => axiosInstance.post(`${API_BASE}/devices/${id}/sync_logs/`),

    /**
     * Sync logs from all active devices
     * @returns {Promise}
     */
    syncAll: () => axiosInstance.post(`${API_BASE}/devices/sync_all/`),

    /**
     * Get biometric logs
     * @param {Object} params - Query parameters (e.g. employee, device, is_processed)
     * @returns {Promise}
     */
    getLogs: (params = {}) => axiosInstance.get(`${API_BASE}/logs/`, { params }),
};

export default biometricApi;
