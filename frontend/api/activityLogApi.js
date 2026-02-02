import axiosInstance from './axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from './config';

/**
 * Activity Log API Service
 */
export const getActivityLogs = async (params = {}) => {
    try {
        const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.AUDIT_LOGS, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
    }
};

export const getActivityLogDetail = async (id) => {
    try {
        const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.AUDIT_LOG_DETAIL(id));
        return response.data;
    } catch (error) {
        console.error('Error fetching activity log detail:', error);
        throw error;
    }
};

export const exportActivityLogs = async (params = {}) => {
    try {
        const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.AUDIT_LOGS, {
            params: { ...params, page_size: 1000 },
            responseType: 'json'
        });
        return response.data.results;
    } catch (error) {
        console.error('Error exporting activity logs:', error);
        throw error;
    }
};
