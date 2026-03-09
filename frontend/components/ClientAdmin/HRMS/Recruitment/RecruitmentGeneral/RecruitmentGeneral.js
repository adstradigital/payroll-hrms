'use client';

import React from 'react';
import { Briefcase, Users, FileText, CheckCircle, Clock, Calendar } from 'lucide-react';
import './RecruitmentGeneral.css';

export default function RecruitmentGeneral() {
    return (
        <div className="recruitment-general-container">
            {/* Header Section */}
            <div className="general-header">
                <div>
                    <h2>Recruitment Overview</h2>
                    <p>Welcome to the recruitment management dashboard.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary">Download Report</button>
                    <button className="btn btn-primary">Create Job Posting</button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="general-stats">
                <div className="stat-card blue">
                    <div className="stat-icon"><Briefcase size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">12</span>
                        <span className="stat-label">Active Jobs</span>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">45</span>
                        <span className="stat-label">New Candidates</span>
                    </div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-icon"><FileText size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">8</span>
                        <span className="stat-label">Pending Reviews</span>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">24</span>
                        <span className="stat-label">Hired This Month</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="general-content-grid">
                
                {/* Recent Activity / Openings */}
                <div className="content-section">
                    <div className="section-header">
                        <h3>Recent Job Openings</h3>
                        <a href="#" className="view-all">View All</a>
                    </div>
                    <div className="job-list">
                        {[
                            { title: 'Senior React Developer', type: 'Full-time', candidates: 12, status: 'Active' },
                            { title: 'UI/UX Designer', type: 'Part-time', candidates: 5, status: 'Active' },
                            { title: 'Python Backend Engineer', type: 'Remote', candidates: 8, status: 'Closing Soon' },
                            { title: 'HR Manager', type: 'Full-time', candidates: 20, status: 'Active' },
                        ].map((job, index) => (
                            <div key={index} className="job-item">
                                <div className="job-info">
                                    <h4>{job.title}</h4>
                                    <span className="job-meta">{job.type}</span>
                                </div>
                                <div className="job-stats">
                                    <span className="candidate-count">{job.candidates} Applicants</span>
                                    <span className={`status-badge ${job.status === 'Active' ? 'success' : 'warning'}`}>
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Interviews */}
                <div className="content-section">
                    <div className="section-header">
                        <h3>Upcoming Interviews</h3>
                        <a href="#" className="view-all">View Calendar</a>
                    </div>
                    <div className="interview-list">
                        {[
                            { name: 'Sarah Wilson', role: 'UI Designer', time: '10:00 AM', date: 'Today' },
                            { name: 'Michael Chen', role: 'React Dev', time: '02:00 PM', date: 'Today' },
                            { name: 'Emily Davis', role: 'HR Manager', time: '11:00 AM', date: 'Tomorrow' },
                        ].map((interview, index) => (
                            <div key={index} className="interview-item">
                                <div className="interview-time">
                                    <Clock size={16} />
                                    <span>{interview.time}</span>
                                </div>
                                <div className="interview-details">
                                    <h4>{interview.name}</h4>
                                    <p>{interview.role}</p>
                                </div>
                                <div className="interview-date">
                                    {interview.date}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
