'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Mail, Phone, MapPin, Star, MoreVertical } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Candidates.css';

const stages = [
    { id: 'NEW', label: 'New', color: 'secondary' },
    { id: 'SCREENING', label: 'Screening', color: 'info' },
    { id: 'INTERVIEW', label: 'Interview', color: 'warning' },
    { id: 'OFFERED', label: 'Offered', color: 'success' },
    { id: 'HIRED', label: 'Hired', color: 'success' },
    { id: 'REJECTED', label: 'Rejected', color: 'danger' },
];

export default function Candidates() {
    const [candidates, setCandidates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await recruitmentApi.getCandidates();
            setCandidates(response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const fullName = c.full_name || `${c.first_name} ${c.last_name}`;
        const jobTitle = c.current_job_title || '';
        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const stageInfo = stages.find(s => s.id === status);
        return stageInfo ? `badge-${stageInfo.color}` : 'badge-secondary';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };
    
    // Helper to get initials
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
    };

    if (loading) return <div>Loading candidates...</div>;

    return (
        <div className="candidates">
            {/* Toolbar */}
            <div className="candidates-toolbar">
                <div className="candidates-toolbar__left">
                    <div className="candidates-search">
                        <Search size={18} className="candidates-search__icon" />
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            className="candidates-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="candidates-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        {stages.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Candidates Table */}
            <div className="candidates-table-container">
                <table className="candidates-table">
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Position</th>
                            <th>Experience</th>
                            <th>Status</th>
                            <th>Rating</th>
                            <th>Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCandidates.map(candidate => (
                            <tr key={candidate.id}>
                                <td>
                                    <div className="candidate-info">
                                        <div className="candidate-avatar">
                                            {getInitials(candidate.first_name, candidate.last_name)}
                                        </div>
                                        <div className="candidate-details">
                                            <span className="candidate-name">{candidate.full_name || `${candidate.first_name} ${candidate.last_name}`}</span>
                                            <span className="candidate-email">{candidate.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{candidate.current_job_title || '-'}</td>
                                <td>{candidate.total_experience_years ? `${candidate.total_experience_years} years` : '-'}</td>
                                <td>
                                    <span className={`badge ${getStatusBadge(candidate.status)}`}>
                                        {stages.find(s => s.id === candidate.status)?.label || candidate.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="candidate-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                className={i < (Number(candidate.overall_rating) || 0) ? 'star--filled' : 'star--empty'}
                                            />
                                        ))}
                                    </div>
                                </td>
                                <td>{formatDate(candidate.created_at)}</td>
                                <td>
                                    <button className="action-btn">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
