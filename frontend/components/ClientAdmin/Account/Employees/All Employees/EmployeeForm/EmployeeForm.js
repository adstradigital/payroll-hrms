'use client';

import { useState, useEffect } from 'react';
import {
    X, Save, User, Briefcase,
    Home, CreditCard, Shield, Plus, Edit2, Lock,
    Mail, Phone, AlertCircle, CheckCircle
} from 'lucide-react';
import {
    getAllDepartments,
    getAllDesignations,
    createEmployee,
    updateEmployee,
    getEmployeeById
} from '@/api/api_clientadmin';
import './EmployeeForm.css';

export default function EmployeeForm({ employeeId, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [formData, setFormData] = useState({
        // Personal Info
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'male',

        // Employment Info
        employee_id: '',
        department: '',
        designation: '',
        employment_type: 'permanent',
        date_of_joining: new Date().toISOString().split('T')[0],
        status: 'active',

        // User Account Fields (New)
        enable_login: false,
        username: '',
        password: '',
        access_role: 'employee',

        // Banking
        bank_name: '',
        bank_account_number: '',
        bank_ifsc_code: '',
        current_ctc: '',
        basic_salary: '',

        // Address
        current_address: '',
        current_city: '',
        current_state: '',
        current_pincode: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setFetching(true);
            try {
                const [deptRes, desigRes] = await Promise.all([
                    getAllDepartments(),
                    getAllDesignations()
                ]);
                setDepartments(deptRes.data.results || deptRes.data);
                setDesignations(desigRes.data.results || desigRes.data);

                if (employeeId) {
                    const empRes = await getEmployeeById(employeeId);
                    const emp = empRes.data.employee;
                    setFormData({
                        ...formData,
                        ...emp,
                        department: emp.department?.id || emp.department || '',
                        designation: emp.designation?.id || emp.designation || '',
                        // Map existing employee data to form
                        enable_login: emp.has_user_account || false,
                        username: emp.username || emp.email, // Default to email if no username
                        access_role: emp.access_role || 'employee',
                        password: '' // Don't populate password
                    });
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchInitialData();
    }, [employeeId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        console.log('[EmployeeForm] 📤 Submitting employee form');
        console.log('[EmployeeForm] Mode:', employeeId ? 'UPDATE' : 'CREATE');

        try {
            // Prepare payload - only send password if it's set or if it's a new user with login enabled
            const payload = { ...formData };
            if (!payload.enable_login) {
                delete payload.username;
                delete payload.password;
                delete payload.access_role;
            } else if (!payload.password && employeeId) {
                // If editing and password is blank, don't send it (means no change)
                delete payload.password;
            }

            console.log('[EmployeeForm] 📦 Payload:', payload);

            let response;
            if (employeeId) {
                console.log('[EmployeeForm] Calling updateEmployee:', employeeId);
                response = await updateEmployee(employeeId, payload);
            } else {
                console.log('[EmployeeForm] Calling createEmployee');
                response = await createEmployee(payload);
            }

            console.log('[EmployeeForm] ✅ Success:', response?.data);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('[EmployeeForm] ❌ Error saving employee:', error);
            console.error('[EmployeeForm] Error response:', error.response?.data);
            console.error('[EmployeeForm] Error status:', error.response?.status);
            console.error('[EmployeeForm] Full error:', error);

            const errorMsg = error.response?.data?.error || 'Failed to save employee. Please check required fields.';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Information', icon: User },
        { id: 'employment', label: 'Employment Details', icon: Briefcase },
        { id: 'user', label: 'User Access', icon: Shield },
        { id: 'banking', label: 'Banking & Salary', icon: CreditCard },
        { id: 'address', label: 'Address Details', icon: Home }
    ];

    if (fetching) return <div className="fetching-loader">Fetching employee data...</div>;

    return (
        <div className="employee-form-overlay">
            <div className="employee-form-modal animate-slide-up">

                {/* Header */}
                <div className="form-header">
                    <div className="header-title">
                        <div className="header-icon">
                            {employeeId ? <Edit2 size={24} /> : <Plus size={24} />}
                        </div>
                        <div>
                            <h3>{employeeId ? 'Edit Employee' : 'Add New Employee'}</h3>
                            <p>{employeeId ? `Updating details for ${formData.first_name}` : 'Fill in the details below'}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body: Sidebar + Content */}
                <div className="form-layout">
                    {/* Sidebar Tabs */}
                    <div className="form-sidebar">
                        <div className="sidebar-nav">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="form-content-area">
                        <form id="empForm" onSubmit={handleSubmit} className="h-full">

                            {activeTab === 'personal' && (
                                <div className="form-grid animate-fade-in">
                                    <div className="form-group">
                                        <label>First Name <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                        <label>Email Address <span style={{ color: 'red' }}>*</span></label>
                                        <div className="input-wrapper">
                                            <Mail className="input-icon" size={18} />
                                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="form-control has-icon" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="form-control">
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="form-control" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'employment' && (
                                <div className="form-grid animate-fade-in">
                                    <div className="form-group">
                                        <label>Employee ID <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" name="employee_id" required value={formData.employee_id} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Department <span style={{ color: 'red' }}>*</span></label>
                                        <select name="department" required value={formData.department} onChange={handleChange} className="form-control">
                                            <option value="">Select Department</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Designation <span style={{ color: 'red' }}>*</span></label>
                                        <select name="designation" required value={formData.designation} onChange={handleChange} className="form-control">
                                            <option value="">Select Designation</option>
                                            {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Joining Date <span style={{ color: 'red' }}>*</span></label>
                                        <input type="date" name="date_of_joining" required value={formData.date_of_joining} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Employment Type</label>
                                        <select name="employment_type" value={formData.employment_type} onChange={handleChange} className="form-control">
                                            <option value="permanent">Permanent</option>
                                            <option value="part_time">Part Time</option>
                                            <option value="contract">Contract</option>
                                            <option value="intern">Intern</option>
                                            <option value="consultant">Consultant</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className="form-control">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="on_leave">On Leave</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'user' && (
                                <div className="animate-fade-in">
                                    {/* Enable/Disable Card */}
                                    <div className="user-enable-card">
                                        <div className="toggle-header">
                                            <div className="toggle-info">
                                                <div className={`toggle-icon ${formData.enable_login ? 'active' : ''}`}>
                                                    <Lock size={24} />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontWeight: 700 }}>Portal Access</h4>
                                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Allow employee to login to system</p>
                                                </div>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    name="enable_login"
                                                    checked={formData.enable_login}
                                                    onChange={handleChange}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.enable_login && (
                                        <div className="form-grid animate-fade-in">
                                            <div className="form-group">
                                                <label>Username</label>
                                                <div className="input-wrapper">
                                                    <User className="input-icon" size={18} />
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        placeholder="e.g. email address"
                                                        className="form-control has-icon"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Password</label>
                                                <div className="input-wrapper">
                                                    <Lock className="input-icon" size={18} />
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder={employeeId ? "Leave blank to keep current" : "Set initial password"}
                                                        className="form-control has-icon"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                                <label>Assigned Role & Permissions</label>
                                                <div className="role-info-card">
                                                    {formData.designation ? (
                                                        <div className="role-info-content">
                                                            <div className="role-badge">
                                                                <Briefcase size={16} />
                                                                <span>
                                                                    {designations.find(d => d.id === formData.designation)?.name || 'Unknown Designation'}
                                                                </span>
                                                            </div>
                                                            <p className="role-description">
                                                                Access permissions and system roles are automatically inherited from the assigned designation.
                                                                To modify these permissions, please visit the <strong>Roles & Permissions</strong> settings.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="role-warning">
                                                            <div className="warning-icon">
                                                                <AlertCircle size={18} />
                                                            </div>
                                                            <div className="warning-content">
                                                                <p className="warning-title">No Designation Selected</p>
                                                                <p className="warning-text">Please select a designation in the <strong>Employment Details</strong> tab to assign permissions.</p>
                                                                <button
                                                                    type="button"
                                                                    className="warning-link"
                                                                    onClick={() => setActiveTab('employment')}
                                                                >
                                                                    Go to Employment Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(activeTab === 'banking' || activeTab === 'address') && (
                                <div className="placeholder-ui animate-fade-in">
                                    <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                    <p>Please use tabs to navigate sections (Implemented as per mockup)</p>
                                    <p style={{ fontSize: '0.8rem' }}>If you need these sections fully implemented with fields, let me know.</p>
                                    {/* Keeping the fields available in state but hiding them for UI simplicity as per mockup request, or I can implement them. User snippet showed them as 'Simplified other tabs'. I'll follow snippet logic but I added fields in state so they are preserved if previously set. */}
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="form-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" form="empForm" className="btn-save" disabled={loading}>
                        {loading ? 'Saving...' : (
                            <>
                                <Save size={18} />
                                {employeeId ? 'Save Changes' : 'Create Employee'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
