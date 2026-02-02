const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

const getAuthHeadersMultipart = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Authorization': `Bearer ${token}`,
    };
};

// ==================== HELP ARTICLES ====================

export const getCategories = async () => {
    const response = await fetch(`${API_URL}/support/categories/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
};

export const getFeaturedArticles = async () => {
    const response = await fetch(`${API_URL}/support/articles/featured/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch featured articles');
    return response.json();
};

export const getPopularArticles = async () => {
    const response = await fetch(`${API_URL}/support/articles/popular/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch popular articles');
    return response.json();
};

export const getArticleBySlug = async (slug) => {
    const response = await fetch(`${API_URL}/support/articles/${slug}/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch article');
    return response.json();
};

export const searchArticles = async (query) => {
    const response = await fetch(`${API_URL}/support/articles/search/?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to search articles');
    return response.json();
};

export const markArticleHelpful = async (slug, isHelpful) => {
    const response = await fetch(`${API_URL}/support/articles/${slug}/mark_helpful/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_helpful: isHelpful }),
    });
    if (!response.ok) throw new Error('Failed to mark article');
    return response.json();
};

// ==================== SUPPORT TICKETS ====================

export const getMyTickets = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_URL}/support/tickets/?${params.toString()}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
};

export const getAllTickets = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_URL}/support/tickets/?${params.toString()}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
};

export const getTicketById = async (id) => {
    const response = await fetch(`${API_URL}/support/tickets/${id}/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch ticket');
    return response.json();
};

export const createTicket = async (data) => {
    const response = await fetch(`${API_URL}/support/tickets/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create ticket');
    return response.json();
};

export const addComment = async (ticketId, comment, isInternal = false) => {
    const response = await fetch(`${API_URL}/support/tickets/${ticketId}/add_comment/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment, is_internal: isInternal }),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
};

export const uploadAttachment = async (ticketId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/support/tickets/${ticketId}/upload_attachment/`, {
        method: 'POST',
        headers: getAuthHeadersMultipart(),
        body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload attachment');
    return response.json();
};

export const closeTicket = async (ticketId) => {
    const response = await fetch(`${API_URL}/support/tickets/${ticketId}/close_ticket/`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to close ticket');
    return response.json();
};

export const reopenTicket = async (ticketId) => {
    const response = await fetch(`${API_URL}/support/tickets/${ticketId}/reopen_ticket/`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to reopen ticket');
    return response.json();
};

export const getTicketStats = async () => {
    const response = await fetch(`${API_URL}/support/tickets/stats/`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch ticket stats');
    return response.json();
};
