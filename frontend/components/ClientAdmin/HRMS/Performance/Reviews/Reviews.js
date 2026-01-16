'use client';

import { useState } from 'react';
import { Search, Plus, Star, Calendar, TrendingUp, User } from 'lucide-react';
import './Reviews.css';

const mockReviews = [
    { id: 1, employee: 'John Doe', reviewer: 'Manager A', period: 'Q4 2025', rating: 4.5, status: 'completed', date: '2026-01-10' },
    { id: 2, employee: 'Jane Smith', reviewer: 'Manager B', period: 'Q4 2025', rating: 4.8, status: 'completed', date: '2026-01-12' },
    { id: 3, employee: 'Mike Johnson', reviewer: 'Manager A', period: 'Q4 2025', rating: null, status: 'pending', date: '2026-01-20' },
    { id: 4, employee: 'Sarah Wilson', reviewer: 'Manager C', period: 'Q4 2025', rating: null, status: 'in_progress', date: '2026-01-15' },
];

export default function Reviews() {
    const [reviews, setReviews] = useState(mockReviews);
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status) => {
        const badges = {
            completed: 'badge-success',
            in_progress: 'badge-warning',
            pending: 'badge-secondary',
        };
        return badges[status] || '';
    };

    const getStatusLabel = (status) => {
        const labels = {
            completed: 'Completed',
            in_progress: 'In Progress',
            pending: 'Pending',
        };
        return labels[status] || status;
    };

    return (
        <div className="reviews">
            <div className="reviews-toolbar">
                <div className="reviews-search">
                    <Search size={18} className="reviews-search__icon" />
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        className="reviews-search__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary">
                    <Plus size={18} />
                    New Review
                </button>
            </div>

            <div className="reviews-table-container">
                <table className="reviews-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Reviewer</th>
                            <th>Period</th>
                            <th>Rating</th>
                            <th>Status</th>
                            <th>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(review => (
                            <tr key={review.id}>
                                <td>
                                    <div className="employee-cell">
                                        <div className="employee-avatar">
                                            {review.employee.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        {review.employee}
                                    </div>
                                </td>
                                <td>{review.reviewer}</td>
                                <td>{review.period}</td>
                                <td>
                                    {review.rating ? (
                                        <div className="rating-cell">
                                            <Star size={14} className="star--filled" />
                                            <span>{review.rating}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted">--</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge ${getStatusBadge(review.status)}`}>
                                        {getStatusLabel(review.status)}
                                    </span>
                                </td>
                                <td>{review.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
