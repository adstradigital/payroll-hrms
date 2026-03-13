import axiosInstance from './axiosInstance';

const API_BASE = '/api/reimbursements';

export const reimbursementsApi = {
  // Submit new expense claim
  submitClaim: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'receipt' && data.receipt) {
        formData.append(key, data.receipt);
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return axiosInstance.post(`${API_BASE}/submit/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get my claims
  getMyClaims: () => axiosInstance.get(`${API_BASE}/my-claims/`),

  // Categories
  getCategories: () => axiosInstance.get(`${API_BASE}/categories/`),
  createCategory: (data) => axiosInstance.post(`${API_BASE}/categories/`, data),
  updateCategory: (id, data) => axiosInstance.put(`${API_BASE}/categories/${id}/`, data),
  deleteCategory: (id) => axiosInstance.delete(`${API_BASE}/categories/${id}/`),

  // Approvals
  getPendingApprovals: () => axiosInstance.get(`${API_BASE}/approvals/`),
  approveClaim: (id) => axiosInstance.put(`${API_BASE}/approve/${id}/`),
  rejectClaim: (id) => axiosInstance.put(`${API_BASE}/reject/${id}/`),
};

// Mock data for development
export const mockClaims = [
  { id: 1, title: 'Travel to Client Meeting', category: {name: 'Travel'}, amount: 150.00, claim_date: '2024-02-15', status: 'approved', created_at: '2024-02-20' },
  { id: 2, title: 'Office Supplies', category: {name: 'Supplies'}, amount: 45.50, claim_date: '2024-02-18', status: 'pending', created_at: '2024-02-19' },
  { id: 3, title: 'Client Lunch', category: {name: 'Meals'}, amount: 85.00, claim_date: '2024-02-21', status: 'rejected', created_at: '2024-02-22' },
];

export const mockCategories = [
  { id: 1, name: 'Travel', description: 'Business travel expenses' },
  { id: 2, name: 'Meals', description: 'Client meals and entertainment' },
  { id: 3, name: 'Supplies', description: 'Office supplies and equipment' },
  { id: 4, name: 'Training', description: 'Training and development courses' },
];

