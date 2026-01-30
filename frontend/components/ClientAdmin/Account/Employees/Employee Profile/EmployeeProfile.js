'use client';

import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin,
    Briefcase, Calendar, Clock, CreditCard,
    Shield, FileText, LayoutGrid,
    Edit2, Download, Printer,
    CheckCircle2, AlertCircle, Loader2, Send, X
} from 'lucide-react';
import { getEmployeeById, getMyProfile } from '@/api/api_clientadmin';
import EditProfile from './EditProfile/EditProfile';
import IdCard from './IdCardGenerate/IdCard';
import RequestManager from './Requests/RequestManager';
import ProfileDocuments from './Documents/ProfileDocuments';
import ProfilePayroll from './Payroll/ProfilePayroll';
import './EmployeeProfile.css';

export default function EmployeeProfile({ employeeId, onBack }) {
    const [activeTab, setActiveTab] = useState('about');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);

    // Quick Request States for Sidebar
    const [quickRequestMode, setQuickRequestMode] = useState(false);

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
        dob: employee.date_of_birth || 'N/A',
        gender: employee.gender || 'N/A',
        address: employee.current_address || 'Address not registered',
    };

    const tabs = [
        { id: 'about', label: 'Overview' },
        { id: 'work_type', label: 'Work & Shift' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'leave', label: 'Leave' },
        { id: 'payroll', label: 'Payroll' },
        { id: 'allowance', label: 'Allowance & Deduction' },
        { id: 'penalty', label: 'Penalty Account' },
        { id: 'assets', label: 'Assets' },
        { id: 'performance', label: 'Performance' },
        { id: 'documents', label: 'Documents' },
        { id: 'requests', label: 'Requests' },
        { id: 'bonus', label: 'Bonus Points' },
        { id: 'interview', label: 'Interview' },
        { id: 'resignation', label: 'Resignation' }
    ];

    const calculateYearsOfService = (joinDate) => {
        if (!joinDate) return '0.0';
        const start = new Date(joinDate);
        const today = new Date();
        if (start > today) return '0.0';
        const diffTime = today - start;
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        return diffYears.toFixed(1);
    };

    return (
        <div className="saas-wrapper">
            {/* --- Header --- */}
            <header className="profile-header">
                <div className="header-banner"></div>
                <div className="header-content">
                    <div className="profile-identity">
                        <div className="avatar-wrapper">
                            <div className="avatar">
                                <div className="avatar-img">
                                    {emp.name.split(' ').map(n => n?.[0]).join('')}
                                </div>
                            </div>
                            <div className="status-indicator" title={emp.status}></div>
                        </div>
                        <div className="user-details">
                            <h1 className="user-name">{emp.name}</h1>
                            <div className="user-role">
                                {emp.role}
                                <span className="badge">{emp.id}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>
                            <Edit2 size={16} /> Edit Profile
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowIdModal(true)}>
                            <LayoutGrid size={16} /> Digital ID
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Navigation Tabs --- */}
            <nav className="nav-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* --- Main Grid Content --- */}
            <div className="content-grid">

                {/* --- Left Sidebar --- */}
                <aside className="profile-sidebar">
                    <div className="card">
                        <div className="card-title">Contact Info</div>
                        <div className="info-list">
                            <div className="info-item">
                                <span className="info-label"><Mail size={14} /> Email</span>
                                <span className="info-value" title={emp.email}>{emp.email}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label"><Phone size={14} /> Phone</span>
                                <span className="info-value">{emp.phone}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label"><MapPin size={14} /> Location</span>
                                <span className="info-value">{emp.location.split(',')[0]}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Request Widget Placeholder - Redirects to main Request functionality in tabs or opens modal eventually */}
                    <div className="card">
                        <div className="card-title">Quick Actions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveTab('requests')}>
                                <Send size={14} /> New Request
                            </button>
                            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveTab('documents')}>
                                <Download size={14} /> Downloads
                            </button>
                        </div>
                    </div>
                </aside>

                {/* --- Main Content Area --- */}
                <main className="main-content">

                    {activeTab === 'about' && (
                        <div className="overview-section animate-slide-up">
                            <div className="card">
                                {/* Stats Row */}
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-value">{calculateYearsOfService(emp.joinDate)}</div>
                                        <div className="stat-label">Years of Service</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">12</div>
                                        <div className="stat-label">Leave Balance</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">98%</div>
                                        <div className="stat-label">Attendance</div>
                                    </div>
                                </div>

                                <div className="card-divider"></div>

                                <div className="card-title">Personal Information</div>
                                <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Date of Birth</label>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.dob}</div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.gender}</div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.department}</div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Joining Date</label>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.joinDate}</div>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Address</label>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.address}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payroll' && <ProfilePayroll employee={employee} />}

                    {activeTab === 'documents' && <ProfileDocuments employeeId={employeeId || employee.id} />}

                    {activeTab === 'requests' && (
                        <div className="card">
                            <RequestManager employeeId={employeeId || employee.id} />
                        </div>
                    )}

                    {/* Placeholder Logic for Other Tabs */}
                    {['work_type', 'attendance', 'leave', 'allowance', 'penalty', 'assets', 'performance', 'bonus', 'interview', 'resignation'].includes(activeTab) && (
                        <div className="placeholder-state animate-fade-in">
                            <Briefcase size={48} className="placeholder-icon" />
                            <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
                            <p>This module is currently being configured or has no records to display.</p>
                        </div>
                    )}

                </main>
            </div>

            {/* Modals */}
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
