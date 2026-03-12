import axiosInstance from './axiosInstance';

const dashboardApi = {
    getStats: () => axiosInstance.get('/dashboard/stats/'),
    getPipelineStatus: () => axiosInstance.get('/dashboard/pipeline-status/'),
    getApplicationSources: () => axiosInstance.get('/dashboard/application-sources/'),
    getTodayInterviews: () => axiosInstance.get('/interviews/today/'),
};

export default dashboardApi;

