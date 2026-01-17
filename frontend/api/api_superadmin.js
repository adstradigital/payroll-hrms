/**
 * Super Admin API Functions
 */

import axiosInstance from './axiosInstance';
import { SUPERADMIN_ENDPOINTS } from './config';

// Organizations
export const getAllOrganizations = (params) => axiosInstance.get(SUPERADMIN_ENDPOINTS.ORGANIZATIONS, { params });
export const getOrganizationById = (id) => axiosInstance.get(SUPERADMIN_ENDPOINTS.ORGANIZATION_DETAIL(id));
export const createOrganization = (data) => axiosInstance.post(SUPERADMIN_ENDPOINTS.ORGANIZATIONS, data);
export const updateOrganization = (id, data) => axiosInstance.put(SUPERADMIN_ENDPOINTS.ORGANIZATION_DETAIL(id), data);
export const deleteOrganization = (id) => axiosInstance.delete(SUPERADMIN_ENDPOINTS.ORGANIZATION_DETAIL(id));

// Subscriptions
export const getAllSubscriptions = (params) => axiosInstance.get(SUPERADMIN_ENDPOINTS.SUBSCRIPTIONS, { params });
export const getSubscriptionPlans = () => axiosInstance.get(SUPERADMIN_ENDPOINTS.SUBSCRIPTION_PLANS);

// Users
export const getAllUsers = (params) => axiosInstance.get(SUPERADMIN_ENDPOINTS.ALL_USERS, { params });
export const getUserById = (id) => axiosInstance.get(SUPERADMIN_ENDPOINTS.USER_DETAIL(id));
export const updateUser = (id, data) => axiosInstance.put(SUPERADMIN_ENDPOINTS.USER_DETAIL(id), data);
export const deleteUser = (id) => axiosInstance.delete(SUPERADMIN_ENDPOINTS.USER_DETAIL(id));

// Analytics
export const getAnalytics = (params) => axiosInstance.get(SUPERADMIN_ENDPOINTS.ANALYTICS, { params });
export const getDashboardStats = () => axiosInstance.get(SUPERADMIN_ENDPOINTS.DASHBOARD_STATS);
