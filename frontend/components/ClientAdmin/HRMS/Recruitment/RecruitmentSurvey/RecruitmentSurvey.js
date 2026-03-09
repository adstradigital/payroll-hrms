'use client';

import React, { useState } from 'react';
import { Search, Plus, MoreVertical, FileText, Filter } from 'lucide-react';
import './RecruitmentSurvey.css';

export default function RecruitmentSurvey() {
    const [surveys] = useState([
        { id: 1, title: 'Candidate Experience Survey', questions: 12, responses: 45, status: 'Active', created: '2023-10-15' },
        { id: 2, title: 'Technical Screen Feedback', questions: 8, responses: 23, status: 'Active', created: '2023-10-20' },
        { id: 3, title: 'Onboarding Feedback', questions: 15, responses: 112, status: 'Closed', created: '2023-09-01' },
        { id: 4, title: 'Interviewer Feedback Form', questions: 5, responses: 89, status: 'Active', created: '2023-08-15' },
    ]);

    return (
        <div className="recruitment-survey-container">
            <div className="survey-header">
                <div>
                    <h2>Recruitment Surveys</h2>
                    <p>Manage and analyze feedback from candidates and interviewers.</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} /> Create New Survey
                </button>
            </div>

            <div className="survey-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search surveys..." />
                </div>
                <div className="filter-actions">
                    <button className="btn btn-outline">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            <div className="survey-table-wrapper">
                <table className="survey-table">
                    <thead>
                        <tr>
                            <th>Survey Title</th>
                            <th>Questions</th>
                            <th>Responses</th>
                            <th>Status</th>
                            <th>Created On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {surveys.map((survey) => (
                            <tr key={survey.id}>
                                <td>
                                    <div className="survey-title-cell">
                                        <div className="icon-wrapper">
                                            <FileText size={16} />
                                        </div>
                                        <span>{survey.title}</span>
                                    </div>
                                </td>
                                <td>{survey.questions}</td>
                                <td>{survey.responses}</td>
                                <td>
                                    <span className={`status-badge ${survey.status.toLowerCase()}`}>
                                        {survey.status}
                                    </span>
                                </td>
                                <td>{survey.created}</td>
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
