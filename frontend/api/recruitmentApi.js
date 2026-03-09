import axiosInstance from './axiosInstance';

const recruitmentApi = {
    // Job Openings
    getJobs: (params) => axiosInstance.get('/recruitment/job-openings/', { params }),
    getJob: (id) => axiosInstance.get(`/recruitment/job-openings/${id}/`),
    createJob: (data) => axiosInstance.post('/recruitment/job-openings/', data),
    updateJob: (id, data) => axiosInstance.put(`/recruitment/job-openings/${id}/`, data),
    deleteJob: (id) => axiosInstance.delete(`/recruitment/job-openings/${id}/`),
    getJobStats: () => axiosInstance.get('/recruitment/job-openings/stats/'),
    duplicateJob: (id) => axiosInstance.post(`/recruitment/job-openings/${id}/duplicate/`),

    // Candidates
    getCandidates: (params) => axiosInstance.get('/recruitment/candidates/', { params }),
    getCandidate: (id) => axiosInstance.get(`/recruitment/candidates/${id}/`),
    createCandidate: (data) => {
        // Handle file upload if data contains file
        const config = {};
        if (data instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' };
        }
        return axiosInstance.post('/recruitment/candidates/', data, config);
    },
    updateCandidate: (id, data) => axiosInstance.put(`/recruitment/candidates/${id}/`, data),
    deleteCandidate: (id) => axiosInstance.delete(`/recruitment/candidates/${id}/`),
    getCandidateStats: () => axiosInstance.get('/recruitment/candidates/stats/'),
    addCandidateNote: (id, data) => axiosInstance.post(`/recruitment/candidates/${id}/add-note/`, data),
    updateCandidateStatus: (id, status) => axiosInstance.put(`/recruitment/candidates/${id}/status/`, { status }),
    toggleCandidateStar: (id) => axiosInstance.put(`/recruitment/candidates/${id}/toggle-star/`),
    
    // Interviews
    getInterviews: (params) => axiosInstance.get('/recruitment/interviews/', { params }),
    getInterview: (id) => axiosInstance.get(`/recruitment/interviews/${id}/`),
    createInterview: (data) => axiosInstance.post('/recruitment/interviews/', data),
    updateInterview: (id, data) => axiosInstance.put(`/recruitment/interviews/${id}/`, data),
    deleteInterview: (id) => axiosInstance.delete(`/recruitment/interviews/${id}/`),
    getUpcomingInterviews: () => axiosInstance.get('/recruitment/interviews/upcoming/'),
    cancelInterview: (id, reason) => axiosInstance.post(`/recruitment/interviews/${id}/cancel/`, { reason }),
    rescheduleInterview: (id, data) => axiosInstance.post(`/recruitment/interviews/${id}/reschedule/`, data),
    submitFeedback: (id, data) => axiosInstance.post(`/recruitment/interviews/${id}/feedback/`, data),
    
    // Applications
    updateApplicationStage: (id, data) => axiosInstance.put(`/recruitment/applications/${id}/stage/`, data),
};

export default recruitmentApi;
