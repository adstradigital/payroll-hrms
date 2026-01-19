'use client';

import { useState, useEffect } from 'react';
import {
    X, Save, User, Briefcase,
    Home, CreditCard, GraduationCap,
    History, Camera, Upload, Plus, Edit2
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
    const [fetching, setFetching] = useState(false);
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
        marital_status: 'single',
        blood_group: '',

        // Employment Info
        employee_id: '',
        department: '',
        designation: '',
        employment_type: 'full_time',
        date_of_joining: new Date().toISOString().split('T')[0],
        status: 'active',
        is_admin: false,

        // Banking & Salary
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
            try {
                const [deptRes, desigRes] = await Promise.all([
                    getAllDepartments(),
                    getAllDesignations()
                ]);
                setDepartments(deptRes.data.results || deptRes.data);
                setDesignations(desigRes.data.results || desigRes.data);

                if (employeeId) {
                    setFetching(true);
                    const empRes = await getEmployeeById(employeeId);
                    const emp = empRes.data.employee;
                    setFormData({
                        ...formData,
                        ...emp,
                        department: emp.department?.id || emp.department || '',
                        designation: emp.designation?.id || emp.designation || ''
                    });
                    setFetching(false);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
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
        try {
            if (employeeId) {
                await updateEmployee(employeeId, formData);
            } else {
                await createEmployee(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Failed to save employee. Please check required fields.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Information', icon: User },
        { id: 'employment', label: 'Employment Details', icon: Briefcase },
        { id: 'banking', label: 'Banking & Salary', icon: CreditCard },
        { id: 'address', label: 'Address Details', icon: Home }
    ];

    if (fetching) return <div className="fetching-loader">Fetching employee data...</div>;

    return (
        <div className="employee-form-overlay">
            <div className="employee-form-modal animate-slide-up">
                <div className="form-header">
                    <div className="header-title">
                        <div className="header-icon">
                            {employeeId ? <Edit2 size={24} /> : <Plus size={24} />}
                        </div>
                        <div>
                            <h3>{employeeId ? `Edit Employee - ${formData.first_name}` : 'Add New Employee'}</h3>
                            <p>Enter the employee's information across the tabs below</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="form-tabs">
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

                <form onSubmit={handleSubmit} className="form-content">
                    {activeTab === 'personal' && (
                        <div className="tab-pane animate-fade-in">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>First Name*</label>
                                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Last Name*</label>
                                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address*</label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number*</label>
                                    <input type="text" name="phone" required value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'employment' && (
                        <div className="tab-pane animate-fade-in">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Employee ID*</label>
                                    <input type="text" name="employee_id" required value={formData.employee_id} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Department*</label>
                                    <select name="department" required value={formData.department} onChange={handleChange}>
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Designation*</label>
                                    <select name="designation" required value={formData.designation} onChange={handleChange}>
                                        <option value="">Select Designation</option>
                                        {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Employment Type</label>
                                    <select name="employment_type" value={formData.employment_type} onChange={handleChange}>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="intern">Intern</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Joining Date*</label>
                                    <input type="date" name="date_of_joining" required value={formData.date_of_joining} onChange={handleChange} />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="is_admin"
                                            checked={formData.is_admin}
                                            onChange={handleChange}
                                        />
                                        Grant Administrative Privileges
                                    </label>
                                    <p className="help-text">Administrators have full access to all modules and settings.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'banking' && (
                        <div className="tab-pane animate-fade-in">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Bank Name</label>
                                    <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Account Number</label>
                                    <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>IFSC Code</label>
                                    <input type="text" name="bank_ifsc_code" value={formData.bank_ifsc_code} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Annual CTC</label>
                                    <input type="number" name="current_ctc" value={formData.current_ctc} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Monthly Basic</label>
                                    <input type="number" name="basic_salary" value={formData.basic_salary} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'address' && (
                        <div className="tab-pane animate-fade-in">
                            <div className="form-group">
                                <label>Current Address</label>
                                <textarea name="current_address" rows="3" value={formData.current_address} onChange={handleChange}></textarea>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" name="current_city" value={formData.current_city} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input type="text" name="current_state" value={formData.current_state} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input type="text" name="current_pincode" value={formData.current_pincode} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (
                                <>
                                    <Save size={18} />
                                    {employeeId ? 'Update Employee' : 'Create Employee'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
