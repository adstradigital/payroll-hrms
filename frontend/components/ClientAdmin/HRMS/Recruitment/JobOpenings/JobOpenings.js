'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Clock, Users, Eye, Edit, Trash2 } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './JobOpenings.css';

export default function JobOpenings() {
    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await recruitmentApi.getJobs();
            setJobs(response.data.results || []);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Debounce or just filter locally for now if list is small, 
        // or trigger API search
        // For now, let's just filter locally as per original code logic, 
        // or effectively we can use the API search:
        // recruitmentApi.getJobs({ search: e.target.value }).then(...)
    };

    // Use local filtering for immediate feedback if list is small
    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'OPEN': return 'badge-success';
            case 'CLOSED': return 'badge-secondary';
            case 'DRAFT': return 'badge-warning';
            case 'ON_HOLD': return 'badge-warning';
            default: return 'badge-secondary';
        }
    };

    const formatEmploymentType = (type) => {
        return type ? type.replace('_', '-').toLowerCase() : '';
    };

    if (loading) return <div>Loading jobs...</div>;

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
                <button className="btn btn-primary" onClick={() => alert('Create Job Modal to be implemented')}>
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
                                {job.status === 'OPEN' ? '● Active' : `● ${job.status}`}
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
                                <span style={{textTransform: 'capitalize'}}>{formatEmploymentType(job.employment_type)}</span>
                            </div>
                            <div className="job-card__detail">
                                <Users size={14} />
                                <span>{job.applications_count} Applicants</span>
                            </div>
                        </div>

                        <div className="job-card__actions">
                            <button className="job-card__btn">View Details</button>
                        </div>
                    </div>
                ))}

                {/* Add New Job Card */}
                <div className="job-card job-card--add" onClick={() => alert('Create Job Modal to be implemented')}>
                    <div className="job-card__add-content">
                        <Plus size={32} />
                        <span>Post New Job</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
