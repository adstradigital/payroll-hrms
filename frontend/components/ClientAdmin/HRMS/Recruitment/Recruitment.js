'use client';

import { useState } from 'react';
import { Briefcase, Users, GitPullRequest, LayoutDashboard, Workflow } from 'lucide-react';
import RecruitDashboard from './RecruitDashboard/RecruitDashboard';
import JobOpenings from './JobOpenings/JobOpenings';
import Candidates from './Candidates/Candidates';
import Pipeline from './Pipeline/Pipeline';
import Stages from './Stages/Stages';
import './Recruitment.css';

export default function Recruitment() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs', label: 'Open Jobs', icon: Briefcase },
        { id: 'candidates', label: 'Candidates', icon: Users },
        { id: 'pipeline', label: 'Hiring Pipeline', icon: GitPullRequest },
        { id: 'stages', label: 'Stages', icon: Workflow },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <RecruitDashboard />;
            case 'jobs':
                return <JobOpenings />;
            case 'candidates':
                return <Candidates />;
            case 'pipeline':
                return <Pipeline />;
            case 'stages':
                return <Stages />;
            default:
                return <JobOpenings />;
        }
    };

    return (
        <div className="recruitment-container">
            <div className="recruitment-header">
                <div className="recruitment-tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`recruitment-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="recruitment-content">
                {renderContent()}
            </div>
        </div>
    );
}
