'use client';

import { useState } from 'react';
import { Search, Filter, Mail, Phone, MapPin, Star, MoreVertical } from 'lucide-react';
import './Candidates.css';

const mockCandidates = [
    { id: 1, name: 'Alex Johnson', email: 'alex@email.com', phone: '+1 234-567-8901', position: 'Senior React Developer', experience: '5 years', stage: 'screening', rating: 4, appliedDate: '2026-01-14' },
    { id: 2, name: 'Emily Chen', email: 'emily@email.com', phone: '+1 234-567-8902', position: 'Product Designer', experience: '3 years', stage: 'interview', rating: 5, appliedDate: '2026-01-13' },
    { id: 3, name: 'Michael Brown', email: 'michael@email.com', phone: '+1 234-567-8903', position: 'Marketing Manager', experience: '7 years', stage: 'offer', rating: 4, appliedDate: '2026-01-10' },
    { id: 4, name: 'Sarah Davis', email: 'sarah@email.com', phone: '+1 234-567-8904', position: 'HR Executive', experience: '2 years', stage: 'applied', rating: 3, appliedDate: '2026-01-15' },
];

const stages = [
    { id: 'applied', label: 'Applied', color: 'secondary' },
    { id: 'screening', label: 'Screening', color: 'info' },
    { id: 'interview', label: 'Interview', color: 'warning' },
    { id: 'offer', label: 'Offer', color: 'success' },
];

export default function Candidates() {
    const [candidates, setCandidates] = useState(mockCandidates);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStage, setFilterStage] = useState('all');

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.position.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStage = filterStage === 'all' || c.stage === filterStage;
        return matchesSearch && matchesStage;
    });

    const getStageBadge = (stage) => {
        const stageInfo = stages.find(s => s.id === stage);
        return stageInfo ? `badge-${stageInfo.color}` : '';
    };

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
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                    >
                        <option value="all">All Stages</option>
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
                            <th>Stage</th>
                            <th>Rating</th>
                            <th>Applied</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCandidates.map(candidate => (
                            <tr key={candidate.id}>
                                <td>
                                    <div className="candidate-info">
                                        <div className="candidate-avatar">
                                            {candidate.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="candidate-details">
                                            <span className="candidate-name">{candidate.name}</span>
                                            <span className="candidate-email">{candidate.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{candidate.position}</td>
                                <td>{candidate.experience}</td>
                                <td>
                                    <span className={`badge ${getStageBadge(candidate.stage)}`}>
                                        {stages.find(s => s.id === candidate.stage)?.label}
                                    </span>
                                </td>
                                <td>
                                    <div className="candidate-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                className={i < candidate.rating ? 'star--filled' : 'star--empty'}
                                            />
                                        ))}
                                    </div>
                                </td>
                                <td>{candidate.appliedDate}</td>
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
