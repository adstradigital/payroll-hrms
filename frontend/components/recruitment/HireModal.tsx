'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Calendar, Briefcase, DollarSign, Shield, Loader2 } from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import { getAllDepartments, getAllDesignations } from '@/api/api_clientadmin';
import { toast } from 'react-hot-toast';
import './HireModal.css';

interface HireModalProps {
    candidate: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const HireCandidateModal = ({ candidate, isOpen, onClose, onSuccess }: HireModalProps) => {
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [fetchingData, setFetchingData] = useState(true);

    const [formData, setFormData] = useState({
        employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        joining_date: new Date().toISOString().split('T')[0],
        department_id: '',
        designation_id: '',
        employment_type: 'permanent',
        basic_salary: candidate.expected_salary ?? '',
        probation_months: 6,
        is_admin: false
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        setFetchingData(true);
        try {
            const [deptRes, desigRes] = await Promise.all([
                getAllDepartments(),
                getAllDesignations()
            ]);
            const depts = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.results || []);
            const desigs = Array.isArray(desigRes.data) ? desigRes.data : (desigRes.data?.results || []);
            
            setDepartments(depts);
            setDesignations(desigs);
        } catch (error) {
            console.error('Failed to fetch departments/designations:', error);
            toast.error('Failed to load organizational data');
        } finally {
            setFetchingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clean payload: Remove empty strings for numeric fields
            const payload = {
                ...formData,
                basic_salary: formData.basic_salary === '' ? null : formData.basic_salary,
            };
            const response = await recruitmentApi.hireCandidate(candidate.id, payload);
            if (response.data?.success) {
                toast.success(`Successfully recruited ${candidate.first_name}!`);
                onSuccess();
                onClose();
            } else {
                toast.error(response.data?.message || 'Hiring failed');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'An error occurred during hiring';
            toast.error(errorMsg);
            if (error.response?.data?.errors) {
                console.error('Validation errors:', error.response.data.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="hire-modal-overlay">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="hire-modal-content"
                >
                    <header className="hire-modal-header">
                        <div className="header-title">
                            <div className="header-icon">
                                <UserPlus size={20} color="#fff" />
                            </div>
                            <div>
                                <h2>Recruit Candidate</h2>
                                <p>Convert {candidate.first_name} {candidate.last_name} to Employee</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="close-btn">
                            <X size={20} />
                        </button>
                    </header>

                    <form onSubmit={handleSubmit} className="hire-modal-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label><Shield size={14} /> Employee ID</label>
                                <input 
                                    type="text" 
                                    value={formData.employee_id}
                                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                    required
                                    placeholder="EMP-001"
                                />
                            </div>

                            <div className="form-group">
                                <label><Calendar size={14} /> Joining Date</label>
                                <input 
                                    type="date" 
                                    value={formData.joining_date}
                                    onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label><Briefcase size={14} /> Department</label>
                                <select 
                                    value={formData.department_id}
                                    onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept: any) => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label><Briefcase size={14} /> Designation</label>
                                <select 
                                    value={formData.designation_id}
                                    onChange={(e) => setFormData({...formData, designation_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map((desig: any) => (
                                        <option key={desig.id} value={desig.id}>{desig.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Employment Type</label>
                                <select 
                                    value={formData.employment_type}
                                    onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                                    required
                                >
                                    <option value="permanent">Permanent</option>
                                    <option value="contract">Contract</option>
                                    <option value="intern">Intern</option>
                                    <option value="consultant">Consultant</option>
                                    <option value="part_time">Part Time</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label><DollarSign size={14} /> Basic Salary</label>
                                <input 
                                    type="number" 
                                    value={formData.basic_salary}
                                    onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                                    placeholder="Enter salary amount"
                                />
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={formData.is_admin}
                                    onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                                />
                                <span>Grant Admin Privileges</span>
                            </label>
                        </div>

                        <div className="modal-footer">
                            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                            <button type="submit" className="confirm-btn" disabled={loading || fetchingData}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Recruitment'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default HireCandidateModal;
