'use client';

import { useState } from 'react';
import {
    Settings as SettingsIcon, ChevronDown, ChevronRight,
    Users, Briefcase, Calendar, Clock, Database,
    UserCheck, Layers
} from 'lucide-react';

// Import settings components from their folders
import GeneralSettings from './GeneralSettings/GeneralSettings';
import IntegrationsSettings from './IntegrationsSettings/IntegrationsSettings';
import SecuritySettings from './SecuritySettings/SecuritySettings';
import LeaveSettings from './LeaveSettings/LeaveSettings';
import WorkShiftSettings from './WorkShiftSettings/WorkShiftSettings';
import AttendanceSettings from './AttendanceSettings/AttendanceSettings';
import HolidaySettings from './HolidaySettings/HolidaySettings';
import WorkSchedulesSettings from './WorkSchedulesSettings/WorkSchedulesSettings';
import OverTimeSettings from './OverTimeRule/OverTimeSettings';
import TaxSettings from './TaxSettings/TaxSettings';

import './Settings.css';

// Settings menu structure
const settingsMenu = [
    {
        id: 'general',
        label: 'General',
        icon: SettingsIcon,
        items: [
            { id: 'general-settings', label: 'General Settings' },
            { id: 'integrations', label: 'Integrations & Data' },
            { id: 'security', label: 'Security & Access' },
            { id: 'employee-permission', label: 'Employee Permission' },
            { id: 'date-time-format', label: 'Date & Time Format' }
        ]
    },
    {
        id: 'base',
        label: 'Base',
        icon: Database,
        items: [
            { id: 'company-info', label: 'Company Info' },
            { id: 'departments', label: 'Departments' },
            { id: 'designations', label: 'Designations' },
            { id: 'work-shifts', label: 'Work Shifts' }
        ]
    },
    {
        id: 'recruitment',
        label: 'Recruitment',
        icon: UserCheck,
        items: [
            { id: 'job-postings', label: 'Job Postings' },
            { id: 'application-stages', label: 'Application Stages' },
            { id: 'interview-templates', label: 'Interview Templates' }
        ]
    },
    {
        id: 'employee',
        label: 'Employee',
        icon: Users,
        items: [
            { id: 'employee-fields', label: 'Employee Fields' },
            { id: 'document-types', label: 'Document Types' },
            { id: 'onboarding', label: 'Onboarding Templates' }
        ]
    },
    {
        id: 'attendance',
        label: 'Attendance',
        icon: Clock,
        items: [
            { id: 'attendance-settings', label: 'Attendance Settings' },
            { id: 'work-schedules', label: 'Work Schedules' },
            { id: 'overtime-rules', label: 'Overtime Rules' }
        ]
    },
    {
        id: 'leave',
        label: 'Leave',
        icon: Calendar,
        items: [
            { id: 'leave-settings', label: 'Leave Settings' },
            { id: 'leave-types', label: 'Leave Types' },
            { id: 'holidays', label: 'Holidays' }
        ]
    },
    {
        id: 'payroll',
        label: 'Payroll',
        icon: Briefcase,
        items: [
            { id: 'payroll-settings', label: 'Payroll Settings' },
            { id: 'salary-components', label: 'Salary Components' },
            { id: 'tax-settings', label: 'Tax Settings' }
        ]
    }
];

// Placeholder for unimplemented sections
function PlaceholderContent({ activeItem }) {
    const title = activeItem.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    return (
        <div className="settings-panel">
            <div className="settings-panel-header">
                <h2>{title}</h2>
                <p>Configure {title.toLowerCase()} options</p>
            </div>
            <div className="settings-card">
                <div className="placeholder-content">
                    <Layers size={48} />
                    <h3>Coming Soon</h3>
                    <p>This settings module is currently under development.</p>
                </div>
            </div>
        </div>
    );
}

// Main Settings Component
export default function Settings() {
    const [expandedSections, setExpandedSections] = useState(['general', 'base', 'attendance', 'leave']);
    const [activeItem, setActiveItem] = useState('general-settings');

    const toggleSection = (sectionId) => {
        if (expandedSections.includes(sectionId)) {
            setExpandedSections(expandedSections.filter(id => id !== sectionId));
        } else {
            setExpandedSections([...expandedSections, sectionId]);
        }
    };

    const renderContent = () => {
        switch (activeItem) {
            case 'general-settings':
                return <GeneralSettings />;
            case 'integrations':
                return <IntegrationsSettings />;
            case 'security':
                return <SecuritySettings />;
            case 'leave-settings':
                return <LeaveSettings />;
            case 'work-shifts':
                return <WorkShiftSettings />;
            case 'attendance-settings':
                return <AttendanceSettings />;
            case 'work-schedules':
                return <WorkSchedulesSettings />;
            case 'overtime-rules':
                return <OverTimeSettings />;
            case 'holidays':
                return <HolidaySettings />;
            case 'tax-settings':
                return <TaxSettings />;
            default:
                return <PlaceholderContent activeItem={activeItem} />;
        }
    };

    return (
        <div className="settings-container">
            {/* Sidebar */}
            <aside className="settings-sidebar">
                <div className="settings-sidebar-header">
                    <SettingsIcon size={20} />
                    <span>Settings</span>
                </div>
                <nav className="settings-nav">
                    {settingsMenu.map((section) => {
                        const Icon = section.icon;
                        const isExpanded = expandedSections.includes(section.id);
                        return (
                            <div key={section.id} className="settings-section">
                                <button
                                    className="settings-section-header"
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <div className="settings-section-label">
                                        <Icon size={16} />
                                        <span>{section.label}</span>
                                    </div>
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                {isExpanded && (
                                    <ul className="settings-section-items">
                                        {section.items.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    className={`settings-item ${activeItem === item.id ? 'active' : ''}`}
                                                    onClick={() => setActiveItem(item.id)}
                                                >
                                                    {item.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="settings-content">
                {renderContent()}
            </main>
        </div>
    );
}
