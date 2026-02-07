/**
 * Performance Module API Service
 * Handles all API calls related to the Performance Management module
 */

import BASE_URL from '../../../../../api/config';

const PERFORMANCE_BASE = `${BASE_URL}/performance`;

// Helper function for authenticated requests
const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || error.message || 'Request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    return response.json();
};

// ==================== DASHBOARD ====================
export const getDashboardStats = async (reviewPeriodId) => {
    const params = reviewPeriodId ? `?review_period_id=${reviewPeriodId}` : '';
    return authFetch(`${PERFORMANCE_BASE}/dashboard/${params}`);
};

// ==================== REVIEW PERIODS ====================
export const getReviewPeriods = async () => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/`);
};

export const getReviewPeriod = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/`);
};

export const createReviewPeriod = async (data) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateReviewPeriod = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deleteReviewPeriod = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/`, {
        method: 'DELETE'
    });
};

export const activateReviewPeriod = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/activate/`, {
        method: 'POST'
    });
};

export const closeReviewPeriod = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/close/`, {
        method: 'POST'
    });
};

export const reopenReviewPeriod = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/reopen/`, {
        method: 'POST'
    });
};

export const getReviewPeriodProgress = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/progress/`);
};

export const runReviewPeriodAutomations = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/run_automations/`, {
        method: 'POST'
    });
};

export const sendReviewReminders = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/review-periods/${id}/send_reminders/`, {
        method: 'POST'
    });
};

// ==================== PERFORMANCE REVIEWS ====================
export const getPerformanceReviews = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return authFetch(`${PERFORMANCE_BASE}/reviews/${params ? `?${params}` : ''}`);
};

export const getPerformanceReview = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${id}/`);
};

export const createPerformanceReview = async (data) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updatePerformanceReview = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deletePerformanceReview = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${id}/`, {
        method: 'DELETE'
    });
};

export const submitSelfAssessment = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${id}/submit_self_assessment/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const submitManagerReview = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${id}/submit_manager_review/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const approveReview = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${id}/approve/`, {
        method: 'POST'
    });
};

export const rejectReview = async (id, rejectionReason) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${id}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason })
    });
};

// Get employee goals for a specific review (used by managers during review)
export const getReviewGoals = async (reviewId) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/${reviewId}/goals/`);
};

export const bulkCreateReviews = async (reviewPeriodId, employeeIds) => {
    return authFetch(`${PERFORMANCE_BASE}/reviews/bulk_create/`, {
        method: 'POST',
        body: JSON.stringify({
            review_period_id: reviewPeriodId,
            employee_ids: employeeIds
        })
    });
};

// ==================== RATING SCALES ====================
export const getRatingScales = async () => {
    return authFetch(`${PERFORMANCE_BASE}/rating-scales/`);
};

export const getRatingScale = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-scales/${id}/`);
};

export const createRatingScale = async (data) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-scales/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateRatingScale = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-scales/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deleteRatingScale = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-scales/${id}/`, {
        method: 'DELETE'
    });
};

// ==================== RATING CATEGORIES ====================
export const getRatingCategories = async () => {
    return authFetch(`${PERFORMANCE_BASE}/rating-categories/`);
};

export const getRatingCategory = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-categories/${id}/`);
};

export const createRatingCategory = async (data) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-categories/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateRatingCategory = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-categories/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deleteRatingCategory = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/rating-categories/${id}/`, {
        method: 'DELETE'
    });
};

// ==================== PERFORMANCE CRITERIA ====================
export const getPerformanceCriteria = async () => {
    return authFetch(`${PERFORMANCE_BASE}/criteria/`);
};

export const getPerformanceCriterion = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/criteria/${id}/`);
};

export const createPerformanceCriteria = async (data) => {
    return authFetch(`${PERFORMANCE_BASE}/criteria/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updatePerformanceCriteria = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/criteria/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deletePerformanceCriteria = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/criteria/${id}/`, {
        method: 'DELETE'
    });
};

// ==================== BONUS MAPPINGS ====================
export const getBonusMappings = async () => {
    return authFetch(`${PERFORMANCE_BASE}/bonus-mappings/`);
};

export const getBonusMapping = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/bonus-mappings/${id}/`);
};

export const createBonusMapping = async (data) => {
    return authFetch(`${PERFORMANCE_BASE}/bonus-mappings/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateBonusMapping = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/bonus-mappings/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deleteBonusMapping = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/bonus-mappings/${id}/`, {
        method: 'DELETE'
    });
};

export const calculateBonus = async (rating, employeeLevel) => {
    const params = new URLSearchParams({ rating });
    if (employeeLevel) params.append('employee_level', employeeLevel);
    return authFetch(`${PERFORMANCE_BASE}/bonus-mappings/calculate_bonus/?${params}`);
};

// ==================== GOALS ====================
export const getGoals = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return authFetch(`${PERFORMANCE_BASE}/goals/${params ? `?${params}` : ''}`);
};

export const getGoal = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/goals/${id}/`);
};

export const createGoal = async (data) => {
    return authFetch(`${PERFORMANCE_BASE}/goals/`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const updateGoal = async (id, data) => {
    return authFetch(`${PERFORMANCE_BASE}/goals/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
};

export const deleteGoal = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/goals/${id}/`, {
        method: 'DELETE'
    });
};

export const updateGoalProgress = async (id, progressPercentage) => {
    return authFetch(`${PERFORMANCE_BASE}/goals/${id}/update_progress/`, {
        method: 'POST',
        body: JSON.stringify({ progress_percentage: progressPercentage })
    });
};

export const claimGoal = async (id) => {
    return authFetch(`${PERFORMANCE_BASE}/goals/${id}/claim/`, {
        method: 'POST'
    });
};

// ==================== REPORTS ====================
export const getPerformanceReport = async (reviewPeriodId) => {
    return authFetch(`${PERFORMANCE_BASE}/reports/?type=performance-report&review_period_id=${reviewPeriodId}`);
};

export const getBonusProjections = async (reviewPeriodId) => {
    return authFetch(`${PERFORMANCE_BASE}/reports/?type=bonus-projections&review_period_id=${reviewPeriodId}`);
};
