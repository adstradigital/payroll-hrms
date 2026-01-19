'use client';

import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin,
    Briefcase, Calendar, Clock, CreditCard,
    GraduationCap, Shield, FileText, ChevronRight,
    Edit2, MoreHorizontal, Download, Printer,
    CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { getEmployeeById, getMyProfile } from '@/api/api_clientadmin';
import EditProfile from './EditProfile/EditProfile';
import IdCard from './IdCardGenerate/IdCard';
import './EmployeeProfile.css';

export default function EmployeeProfile({ employeeId, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [employeeId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = employeeId
                ? await getEmployeeById(employeeId)
                : await getMyProfile();

            setEmployee(res.data.employee || res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load employee profile');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <Loader2 className="animate-spin" size={48} />
                <p>Loading Profile...</p>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="profile-error">
                <AlertCircle size={48} />
                <p>{error || 'Employee not found'}</p>
                {onBack && <button onClick={onBack} className="btn btn-primary">Go Back</button>}
            </div>
        );
    }

    const emp = {
        name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
        role: employee.designation_name || employee.designation?.name || 'No Designation',
        id: employee.employee_id || 'N/A',
        email: employee.email,
        phone: employee.phone || 'Not Provided',
        location: employee.current_city ? `${employee.current_city}, ${employee.current_state}` : 'Location Not Set',
        joinDate: employee.date_of_joining,
        status: employee.status || 'active',
        department: employee.department_name || employee.department?.name || 'General',
        manager: 'Manager Info N/A',
        bloodGroup: employee.blood_group || 'N/A',
        dob: employee.date_of_birth || 'N/A',
        gender: employee.gender || 'N/A',
        maritalStatus: employee.marital_status || 'N/A',
        address: employee.current_address || 'Address not registered',
        stats: [
            { label: 'Leave Balance', value: '18 Days', color: 'blue' },
            { label: 'Attendance Rate', value: '98.5%', color: 'green' },
            { label: 'Projects Done', value: '12', color: 'purple' },
            { label: 'Salary Status', value: 'Paid', color: 'orange' }
        ]
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'employment', label: 'Employment', icon: Briefcase },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'banking', label: 'Payroll & Bank', icon: CreditCard },
    ];

    return (
        <div className="profile-container animate-fade-in">
            {/* Header / Hero Section */}
            <div className="profile-hero">
                <div className="hero-cover">
                    {onBack && (
                        <button className="profile-back-btn" onClick={onBack}>
                            <ChevronRight style={{ transform: 'rotate(180deg)' }} size={20} />
                            Back to List
                        </button>
                    )}
                </div>
                <div className="hero-content">
                    <div className="profile-identity">
                        <div className="profile-avatar-wrapper">
                            <div className="profile-avatar">
                                {emp.name.split(' ').map(n => n?.[0]).join('')}
                                <button className="avatar-edit-btn" title="Change Photo">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            <div className={`status-indicator ${emp.status.toLowerCase()}`}></div>
                        </div>
                        <div className="profile-main-info">
                            <h1 className="profile-name">
                                {emp.name}
                                <CheckCircle2 size={20} className="verified-icon" />
                            </h1>
                            <div className="profile-meta">
                                <span className="meta-item"><Briefcase size={14} /> {emp.role}</span>
                                <span className="meta-separator">•</span>
                                <span className="meta-item"><MapPin size={14} /> {emp.location}</span>
                                <span className="meta-item badge-id">{emp.id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="profile-header-actions">
                        <button className="btn btn-secondary-glass" onClick={() => setShowIdModal(true)}>
                            <Printer size={18} /> ID Card
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
                            <Edit2 size={18} /> Edit Profile
                        </button>
                        <button className="btn btn-icon-glass"><MoreHorizontal size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="profile-body-layout">
                {/* Left Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-stats-grid">
                        {emp.stats.map((stat, i) => (
                            <div key={i} className={`stat-card stat-${stat.color}`}>
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-module card shadow-sm">
                        <h3 className="module-title">Contact Information</h3>
                        <ul className="contact-list">
                            <li>
                                <div className="contact-icon"><Mail size={16} /></div>
                                <div className="contact-info">
                                    <span className="label">Work Email</span>
                                    <span className="value">{emp.email}</span>
                                </div>
                            </li>
                            <li>
                                <div className="contact-icon"><Phone size={16} /></div>
                                <div className="contact-info">
                                    <span className="label">Phone</span>
                                    <span className="value">{emp.phone}</span>
                                </div>
                            </li>
                            <li>
                                <div className="contact-icon"><MapPin size={16} /></div>
                                <div className="contact-info">
                                    <span className="label">Current Address</span>
                                    <span className="value">{emp.address}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="profile-main-content">
                    <nav className="profile-nav">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                                {activeTab === tab.id && <div className="active-indicator" />}
                            </button>
                        ))}
                    </nav>

                    <div className="tab-content-wrapper card shadow-sm animate-slide-up">
                        {activeTab === 'overview' && (
                            <div className="tab-pane">
                                <div className="info-section">
                                    <div className="section-header">
                                        <h3 className="section-title">Personal Details</h3>
                                        <button className="text-btn">Edit</button>
                                    </div>
                                    <div className="info-grid">
                                        <div className="info-group">
                                            <span className="info-label">Full Name</span>
                                            <span className="info-value">{emp.name}</span>
                                        </div>
                                        <div className="info-group">
                                            <span className="info-label">Date of Birth</span>
                                            <span className="info-value">{emp.dob}</span>
                                        </div>
                                        <div className="info-group">
                                            <span className="info-label">Gender</span>
                                            <span className="info-value">{emp.gender}</span>
                                        </div>
                                        <div className="info-group">
                                            <span className="info-label">Marital Status</span>
                                            <span className="info-value">{emp.maritalStatus}</span>
                                        </div>
                                        <div className="info-group">
                                            <span className="info-label">Blood Group</span>
                                            <span className="info-value">{emp.bloodGroup}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="info-section">
                                    <div className="section-header">
                                        <h3 className="section-title">Identity & Security</h3>
                                    </div>
                                    <div className="identity-cards">
                                        <div className="id-card-item">
                                            <Shield size={24} className="id-icon" />
                                            <div className="id-details">
                                                <span className="id-name">National Identity</span>
                                                <span className="id-number">Verified</span>
                                            </div>
                                            <Download size={18} className="id-download" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'employment' && (
                            <div className="tab-pane">
                                <div className="info-section">
                                    <h3 className="section-title">Current Status</h3>
                                    <div className="info-grid">
                                        <div className="info-group">
                                            <span className="info-label">Department</span>
                                            <span className="info-value">{emp.department}</span>
                                        </div>
                                        <div className="info-group">
                                            <span className="info-label">Work Anniversary</span>
                                            <span className="info-value">{emp.joinDate}</span>
                                        </div>
                                        <div className="info-group">
                                            <span className="info-label">Employment Type</span>
                                            <span className="info-value">{employee.employment_type || 'Permanent'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab !== 'overview' && activeTab !== 'employment' && (
                            <div className="empty-tab-state">
                                <AlertCircle size={48} />
                                <p>Section content is being prepared.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showEditModal && (
                <EditProfile
                    employee={employee}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={fetchProfile}
                />
            )}

            {showIdModal && (
                <IdCard
                    employee={employee}
                    onClose={() => setShowIdModal(false)}
                />
            )}
        </div>
    );
}
