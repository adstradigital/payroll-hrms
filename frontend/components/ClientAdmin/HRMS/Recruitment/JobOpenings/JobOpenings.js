'use client';

import { useState } from 'react';
import { Search, Plus, MapPin, Clock, Users, Eye, Edit, Trash2 } from 'lucide-react';
import './JobOpenings.css';

const mockJobs = [
    { id: 1, title: 'Senior React Developer', department: 'Engineering', location: 'Remote', type: 'Full-time', applicants: 45, status: 'active', postedDate: '2026-01-10' },
    { id: 2, title: 'Product Designer', department: 'Design', location: 'New York', type: 'Full-time', applicants: 28, status: 'active', postedDate: '2026-01-12' },
    { id: 3, title: 'Marketing Manager', department: 'Marketing', location: 'London', type: 'Contract', applicants: 12, status: 'closed', postedDate: '2026-01-05' },
    { id: 4, title: 'HR Executive', department: 'HR', location: 'Mumbai', type: 'Full-time', applicants: 35, status: 'active', postedDate: '2026-01-15' },
];

export default function JobOpenings() {
    const [jobs, setJobs] = useState(mockJobs);
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status) => {
        return status === 'active' ? 'badge-success' : 'badge-secondary';
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="job-openings">
            {/* Toolbar */}
            <div className="job-toolbar">
                <div className="job-search">
                    <Search size={18} className="job-search__icon" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        className="job-search__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary">
                    <Plus size={18} />
                    Create Job
                </button>
            </div>

            {/* Job Cards Grid */}
            <div className="job-grid">
                {filteredJobs.map(job => (
                    <div key={job.id} className="job-card">
                        <div className="job-card__header">
                            <div className="job-card__icon">
                                <Users size={20} />
                            </div>
                            <span className={`badge ${getStatusBadge(job.status)}`}>
                                {job.status === 'active' ? '● Active' : '● Closed'}
                            </span>
                        </div>

                        <h3 className="job-card__title">{job.title}</h3>
                        <p className="job-card__department">{job.department}</p>

                        <div className="job-card__details">
                            <div className="job-card__detail">
                                <MapPin size={14} />
                                <span>{job.location}</span>
                            </div>
                            <div className="job-card__detail">
                                <Clock size={14} />
                                <span>{job.type}</span>
                            </div>
                            <div className="job-card__detail">
                                <Users size={14} />
                                <span>{job.applicants} Applicants</span>
                            </div>
                        </div>

                        <div className="job-card__actions">
                            <button className="job-card__btn">View Details</button>
                        </div>
                    </div>
                ))}

                {/* Add New Job Card */}
                <div className="job-card job-card--add">
                    <div className="job-card__add-content">
                        <Plus size={32} />
                        <span>Post New Job</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
