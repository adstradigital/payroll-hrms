import axiosInstance from './axiosInstance';

const recruitmentApi = {
    // Recruitment Settings
    getJobPostingSettings: () => axiosInstance.get('/recruitment/settings/job-postings/'),
    saveJobPostingSettings: (data) => axiosInstance.post('/recruitment/settings/job-postings/', data),
    getJobDefaults: () => axiosInstance.get('/recruitment/jobs/defaults/'),

    // Interview Templates
    getInterviewTemplates: () => axiosInstance.get('/recruitment/interview-templates/'),
    createInterviewTemplate: (data) => axiosInstance.post('/recruitment/interview-templates/', data),
    updateInterviewTemplate: (id, data) => axiosInstance.put(`/recruitment/interview-templates/${id}/`, data),
    deleteInterviewTemplate: (id) => axiosInstance.delete(`/recruitment/interview-templates/${id}/`),

    // Skill Zone
    getSkillCategories: () => axiosInstance.get('/recruitment/skill-categories/'),
    createSkillCategory: (data) => axiosInstance.post('/recruitment/skill-categories/', data),
    deleteSkillCategory: (id) => axiosInstance.delete(`/recruitment/skill-categories/${id}/`),
    getSkills: () => axiosInstance.get('/recruitment/skills/'),
    createSkill: (data) => axiosInstance.post('/recruitment/skills/', data),
    updateSkill: (id, data) => axiosInstance.put(`/recruitment/skills/${id}/`, data),
    deleteSkill: (id) => axiosInstance.delete(`/recruitment/skills/${id}/`),
    
    // Rejection Reasons
    getRejectionReasons: () => axiosInstance.get('/recruitment/rejection-reasons/'),
    createRejectionReason: (data) => axiosInstance.post('/recruitment/rejection-reasons/', data),
    updateRejectionReason: (id, data) => axiosInstance.put(`/recruitment/rejection-reasons/${id}/`, data),
    deleteRejectionReason: (id) => axiosInstance.delete(`/recruitment/rejection-reasons/${id}/`),

    // Recruitment Stages
    getStages: () => axiosInstance.get('/recruitment/stages/'),
    createStage: (data) => axiosInstance.post('/recruitment/stages/', data),
    updateStage: (id, data) => axiosInstance.put(`/recruitment/stages/${id}/`, data),
    deleteStage: (id) => axiosInstance.delete(`/recruitment/stages/${id}/`),
    reorderStages: (stageIds) => axiosInstance.patch('/recruitment/stages/reorder/', { stage_ids: stageIds }),

    // Pipeline
    getPipeline: (params) => axiosInstance.get('/recruitment/pipeline/', { params }),

    // Job Openings
    getJobs: (params) => axiosInstance.get('/recruitment/jobs/', { params }),
    getJob: (id) => axiosInstance.get(`/recruitment/jobs/${id}/`),
    createJob: (data) => axiosInstance.post('/recruitment/jobs/', data),
    updateJob: (id, data) => axiosInstance.put(`/recruitment/jobs/${id}/`, data),
    deleteJob: (id) => axiosInstance.delete(`/recruitment/jobs/${id}/`),
    updateJobStatus: (id, status) => axiosInstance.patch(`/recruitment/jobs/${id}/status/`, { status }),
    getJobStats: () => axiosInstance.get('/recruitment/job-openings/stats/'),
    duplicateJob: (id) => axiosInstance.post(`/recruitment/job-openings/${id}/duplicate/`),

    // Candidates
    getCandidates: (params) => axiosInstance.get('/recruitment/candidates/', { params }),
    getCandidate: (id) => axiosInstance.get(`/recruitment/candidates/${id}/`),
    createCandidate: (data) => {
        return axiosInstance.post('/recruitment/candidates/', data);
    },
    updateCandidate: (id, data) => {
        return axiosInstance.put(`/recruitment/candidates/${id}/`, data);
    },
    deleteCandidate: (id) => axiosInstance.delete(`/recruitment/candidates/${id}/`),
    getCandidateStats: () => axiosInstance.get('/recruitment/candidates/stats/'),
    addCandidateNote: (id, data) => axiosInstance.post(`/recruitment/candidates/${id}/add-note/`, data),
    updateCandidateStatus: (id, status) => {
        const payload = typeof status === 'object' ? status : { status };
        return axiosInstance.put(`/recruitment/candidates/${id}/status/`, payload);
    },
    updateCandidateStage: (id, stageId) => axiosInstance.patch(`/recruitment/candidates/${id}/stage/`, { stage_id: stageId }),
    toggleCandidateStar: (id) => axiosInstance.put(`/recruitment/candidates/${id}/toggle-star/`),
    hireCandidate: (id, data) => axiosInstance.post(`/recruitment/candidates/${id}/hire/`, data),
    
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
    updateInterviewStatus: (id, interviewStatus) =>
        axiosInstance.patch(`/recruitment/interviews/${id}/status/`, { status: interviewStatus }),
    updateInterviewResult: (id, interviewResult, feedback) =>
        axiosInstance.patch(`/recruitment/interviews/${id}/result/`, { result: interviewResult, ...(feedback !== undefined ? { feedback } : {}) }),
    
    // Applications
    updateApplicationStage: (id, data) => axiosInstance.put(`/recruitment/applications/${id}/stage/`, data),
    getApplications: (params) => axiosInstance.get('/recruitment/applications/', { params }),
    createApplication: (data) => axiosInstance.post('/recruitment/applications/', data),
    updateApplication: (id, data) => axiosInstance.put(`/recruitment/applications/${id}/`, data),
    deleteApplication: (id) => axiosInstance.delete(`/recruitment/applications/${id}/`),

    // Surveys
    getSurveys: (params) => axiosInstance.get('/recruitment/surveys/', { params }),
    createSurvey: (data) => axiosInstance.post('/recruitment/surveys/', data),
    updateSurvey: (id, data) => axiosInstance.put(`/recruitment/surveys/${id}/`, data),
    deleteSurvey: (id) => axiosInstance.delete(`/recruitment/surveys/${id}/`),
    getSurveyQuestions: (id) => axiosInstance.get(`/recruitment/surveys/${id}/questions/`),
    addSurveyQuestion: (id, data) => axiosInstance.post(`/recruitment/surveys/${id}/questions/`, data),
    submitSurveyResponse: (id, data) => axiosInstance.post(`/recruitment/surveys/${id}/responses/`, data),
    getSurveyResponses: (id, params) => axiosInstance.get(`/recruitment/surveys/${id}/responses/`, { params }),
};

export default recruitmentApi;
