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
    getEmployeeById,
    getEmployeeFieldDefinitions,
    getOnboardingTemplates,
    getSalaryStructures
} from '@/api/api_clientadmin';
import './EmployeeForm.css';

export default function EmployeeForm({ employeeId, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [onboardingTemplates, setOnboardingTemplates] = useState([]);
    const [salaryStructures, setSalaryStructures] = useState([]);
    const [customFieldsDef, setCustomFieldsDef] = useState([]);

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
        onboarding_template: '',

        // Banking & Salary
        bank_name: '',
        bank_account_number: '',
        bank_ifsc_code: '',
        bank_branch: '',
        salary_structure: '',
        gross_salary: '',
        current_ctc: '',
        basic_salary: '',

        // User Account Fields (New)
        enable_login: false,
        username: '',
        password: '',
        access_role: 'employee',

        // Address
        current_address: '',
        current_city: '',
        current_state: '',
        current_pincode: '',

        // Custom Fields
        custom_fields: {}
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setFetching(true);
            try {
                const [deptRes, desigRes, fieldsRes, templateRes, salaryRes] = await Promise.all([
                    getAllDepartments(),
                    getAllDesignations(),
                    getEmployeeFieldDefinitions(),
                    getOnboardingTemplates(),
                    getSalaryStructures()
                ]);
                setDepartments(deptRes.data.results || deptRes.data);
                setDesignations(desigRes.data.results || desigRes.data);
                setOnboardingTemplates(templateRes.data.results || templateRes.data || []);
                setSalaryStructures(salaryRes.data.results || salaryRes.data || []);
                const activeFields = (fieldsRes.data.results || fieldsRes.data || []).filter(f => f.is_active);
                setCustomFieldsDef(activeFields);

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
                        password: '', // Don't populate password
                        custom_fields: emp.custom_fields || {}
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

    const handleCustomFieldChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            custom_fields: {
                ...(prev.custom_fields || {}),
                [key]: value
            }
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
        { id: 'address', label: 'Address Details', icon: Home },
        { id: 'additional', label: 'Custom Info', icon: Plus }
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
                                    {/* Onboarding Template selection hidden for now */}
                                    {false && !employeeId && (
                                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                            <label>Onboarding Template</label>
                                            <select 
                                                name="onboarding_template" 
                                                value={formData.onboarding_template} 
                                                onChange={handleChange} 
                                                className="form-control"
                                                title="Select a template to automatically generate onboarding steps for this employee"
                                            >
                                                <option value="">No Onboarding Template (Manual)</option>
                                                {onboardingTemplates.filter(t => t.is_active).map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                            <p className="form-helper-text">
                                                Assigning a template will create a checklist of tasks for the new employee.
                                            </p>
                                        </div>
                                    )}
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

                            {activeTab === 'additional' && (
                                <div className="form-grid animate-fade-in">
                                    {customFieldsDef.length === 0 ? (
                                        <div className="placeholder-ui" style={{ gridColumn: '1/-1', padding: '2rem' }}>
                                            <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                            <p>No custom fields defined in settings.</p>
                                        </div>
                                    ) : (
                                        customFieldsDef.map(field => (
                                            <div key={field.id || field.field_key} className="form-group">
                                                <label>
                                                    {field.field_name} {field.is_required && <span style={{ color: 'red' }}>*</span>}
                                                </label>
                                                {field.field_type === 'dropdown' ? (
                                                    <select
                                                        className="form-control"
                                                        value={formData.custom_fields[field.field_key] || ''}
                                                        onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                                                        required={field.is_required}
                                                    >
                                                        <option value="">Select Options</option>
                                                        {field.options.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : field.field_type === 'checkbox' ? (
                                                    <div className="checkbox-wrapper" style={{ marginTop: '0.5rem' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!formData.custom_fields[field.field_key]}
                                                            onChange={(e) => handleCustomFieldChange(field.field_key, e.target.checked)}
                                                        />
                                                        <span style={{ marginLeft: '0.5rem' }}>{field.field_name}</span>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={field.field_type === 'date' ? 'date' : field.field_type === 'number' ? 'number' : 'text'}
                                                        className="form-control"
                                                        value={formData.custom_fields[field.field_key] || ''}
                                                        onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                                                        required={field.is_required}
                                                        placeholder={field.description || `Enter ${field.field_name}`}
                                                    />
                                                )}
                                                {field.description && <p className="field-desc" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{field.description}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'banking' && (
                                <div className="animate-fade-in">
                                    <div className="section-title">
                                        <CreditCard size={18} className="text-brand" />
                                        <span>Bank Account Details</span>
                                    </div>
                                    <div className="form-grid mb-8">
                                        <div className="form-group">
                                            <label>Bank Name</label>
                                            <input type="text" name="bank_name" value={formData.bank_name || ''} onChange={handleChange} className="form-control" placeholder="e.g. HDFC Bank" />
                                        </div>
                                        <div className="form-group">
                                            <label>Account Number</label>
                                            <input type="text" name="bank_account_number" value={formData.bank_account_number || ''} onChange={handleChange} className="form-control" placeholder="e.g. 50100..." />
                                        </div>
                                        <div className="form-group">
                                            <label>IFSC Code</label>
                                            <input type="text" name="bank_ifsc_code" value={formData.bank_ifsc_code || ''} onChange={handleChange} className="form-control" placeholder="e.g. HDFC0000..." />
                                        </div>
                                        <div className="form-group">
                                            <label>Branch Name</label>
                                            <input type="text" name="bank_branch" value={formData.bank_branch || ''} onChange={handleChange} className="form-control" placeholder="e.g. Mumbai Main" />
                                        </div>
                                    </div>

                                    <div className="section-title">
                                        <Briefcase size={18} className="text-brand" />
                                        <span>Salary Configuration</span>
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Salary Structure <span className="text-danger">*</span></label>
                                            <select name="salary_structure" value={formData.salary_structure || ''} onChange={handleChange} className="form-control">
                                                <option value="">Select Structure</option>
                                                {salaryStructures.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Monthly Gross Salary (₹) <span className="text-danger">*</span></label>
                                            <input type="number" name="gross_salary" value={formData.gross_salary || ''} onChange={handleChange} className="form-control" placeholder="e.g. 50000" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'address' && (
                                <div className="form-grid animate-fade-in">
                                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                        <label>Residential Address</label>
                                        <textarea name="current_address" rows="3" value={formData.current_address || ''} onChange={handleChange} className="form-control"></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input type="text" name="current_city" value={formData.current_city || ''} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <input type="text" name="current_state" value={formData.current_state || ''} onChange={handleChange} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Pincode</label>
                                        <input type="text" name="current_pincode" value={formData.current_pincode || ''} onChange={handleChange} className="form-control" />
                                    </div>
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
