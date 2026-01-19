'use client';

import { useState, useEffect } from 'react';
import {
    X, Save, User, Mail, Phone, MapPin,
    Briefcase, Calendar, Shield, CreditCard,
    Home, Info
} from 'lucide-react';
import {
    getAllDepartments,
    getAllDesignations,
    updateEmployee
} from '@/api/api_clientadmin';
import './EditProfile.css';

export default function EditProfile({ employee, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [formData, setFormData] = useState({
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        date_of_birth: employee?.date_of_birth || '',
        gender: employee?.gender || 'male',
        marital_status: employee?.marital_status || 'single',
        blood_group: employee?.blood_group || '',

        department: employee?.department?.id || employee?.department || '',
        designation: employee?.designation?.id || employee?.designation || '',
        employment_type: employee?.employment_type || 'permanent',
        date_of_joining: employee?.date_of_joining || '',

        current_address: employee?.current_address || '',
        current_city: employee?.current_city || '',
        current_state: employee?.current_state || '',
        current_pincode: employee?.current_pincode || '',

        bank_name: employee?.bank_name || '',
        bank_account_number: employee?.bank_account_number || '',
        bank_ifsc_code: employee?.bank_ifsc_code || ''
    });

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [deptRes, desigRes] = await Promise.all([
                    getAllDepartments(),
                    getAllDesignations()
                ]);
                setDepartments(deptRes.data.results || deptRes.data);
                setDesignations(desigRes.data.results || desigRes.data);
            } catch (error) {
                console.error('Error fetching metadata:', error);
            }
        };
        fetchMetadata();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
            if (employee?.is_virtual) {
                // For virtual profiles, we create a new employee record
                const payload = {
                    ...formData,
                    company: employee.company?.id,
                    employee_id: `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    status: 'active',
                    is_admin: employee.is_admin || false,
                    user: employee.user_id || null
                };
                await createEmployee(payload);
            } else {
                await updateEmployee(employee.id, formData);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to save profile. Please check your data or contact support.';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'contact', label: 'Contact & Address', icon: MapPin },
        { id: 'employment', label: 'Employment', icon: Briefcase },
        { id: 'banking', label: 'Banking', icon: CreditCard }
    ];

    return (
        <div className="edit-profile-overlay">
            <div className="edit-profile-modal animate-slide-up">
                {employee?.is_virtual && (
                    <div className="virtual-profile-banner">
                        <Info size={16} />
                        <span>Viewing Virtual Profile. Some fields may be read-only until registered.</span>
                    </div>
                )}
                <div className="modal-header">
                    <div className="header-info">
                        <div className="header-icon-bg">
                            <User size={24} className="text-primary" />
                        </div>
                        <div>
                            <h3>Edit Profile</h3>
                            <p>Update your professional and personal information</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`modal-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {activeTab === 'personal' && (
                        <div className="form-grid animate-fade-in">
                            <div className="form-group">
                                <label>First Name</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
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
                            <div className="form-group">
                                <label>Marital Status</label>
                                <select name="marital_status" value={formData.marital_status} onChange={handleChange}>
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                    <option value="divorced">Divorced</option>
                                    <option value="widowed">Widowed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Blood Group</label>
                                <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} placeholder="e.g. O+" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="animate-fade-in">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group mt-3">
                                <label>Current Address</label>
                                <textarea name="current_address" rows="3" value={formData.current_address} onChange={handleChange}></textarea>
                            </div>
                            <div className="form-grid mt-2">
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

                    {activeTab === 'employment' && (
                        <div className="form-grid animate-fade-in">
                            <div className="form-group">
                                <label>Department</label>
                                <select name="department" value={formData.department} onChange={handleChange}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <select name="designation" value={formData.designation} onChange={handleChange}>
                                    <option value="">Select Designation</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Employment Type</label>
                                <select name="employment_type" value={formData.employment_type} onChange={handleChange}>
                                    <option value="permanent">Permanent</option>
                                    <option value="contract">Contract</option>
                                    <option value="intern">Intern</option>
                                    <option value="consultant">Consultant</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Joining Date</label>
                                <input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'banking' && (
                        <div className="form-grid animate-fade-in">
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
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <span className="loader-inline">Saving...</span>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
