'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, User, Building2,
    Calendar, CheckCircle2, ChevronRight, DollarSign,
    Briefcase, AlertCircle, RefreshCw
} from 'lucide-react';
import {
    getEmployeeSalaries, createEmployeeSalary, updateEmployeeSalary,
    getAllEmployees, getSalaryStructures, getCurrentEmployeeSalary
} from '@/api/api_clientadmin';
import './EmployeeSalary.css';

const SalaryAssignmentForm = ({ assignment, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        employee: '',
        salary_structure: '',
        basic_amount: '',
        effective_from: new Date().toISOString().split('T')[0],
        is_current: true,
        remarks: ''
    });

    const [employees, setEmployees] = useState([]);
    const [structures, setStructures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [empRes, structRes] = await Promise.all([
                    getAllEmployees({ status: 'active' }),
                    getSalaryStructures({ is_active: true })
                ]);
                setEmployees(empRes.data.results || empRes.data || []);
                setStructures(structRes.data.results || structRes.data || []);
            } catch (error) {
                console.error("Error fetching options", error);
            } finally {
                setFetchingData(false);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        if (assignment) {
            setFormData({
                employee: assignment.employee?.id || assignment.employee,
                salary_structure: assignment.salary_structure?.id || assignment.salary_structure,
                basic_amount: assignment.basic_amount || '',
                effective_from: assignment.effective_from || new Date().toISOString().split('T')[0],
                is_current: assignment.is_current,
                remarks: assignment.remarks || ''
            });
        }
    }, [assignment]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (assignment) {
                res = await updateEmployeeSalary(assignment.id, formData);
            } else {
                res = await createEmployeeSalary(formData);
            }
            onSuccess(res.data);
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to save salary assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="text-lg font-bold">Assign Salary</h3>
                        <p className="text-xs text-secondary">Configure employee compensation</p>
                    </div>
                    <button onClick={onClose} className="btn-icon"><span className="lucide-x">×</span></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body space-y-4">
                    {fetchingData ? (
                        <div className="p-4 text-center"><div className="spinner"></div></div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label className="form-label">Employee</label>
                                <select
                                    className="form-select"
                                    value={formData.employee}
                                    onChange={e => setFormData({ ...formData, employee: e.target.value })}
                                    disabled={!!assignment}
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name} ({emp.employee_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Salary Structure</label>
                                <select
                                    className="form-select"
                                    value={formData.salary_structure}
                                    onChange={e => setFormData({ ...formData, salary_structure: e.target.value })}
                                    required
                                >
                                    <option value="">Select Structure...</option>
                                    {structures.map(str => (
                                        <option key={str.id} value={str.id}>{str.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Basic Salary Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted">$</span>
                                    <input
                                        type="number"
                                        className="form-input pl-8"
                                        value={formData.basic_amount}
                                        onChange={e => setFormData({ ...formData, basic_amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Effective From</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.effective_from}
                                        onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group flex justify-center flex-col">
                                    <label className="checkbox-container mt-6">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_current}
                                            onChange={e => setFormData({ ...formData, is_current: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium ml-2">Current Salary</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Remarks</label>
                                <textarea
                                    className="form-textarea"
                                    rows="2"
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder="Optional notes..."
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-2 border-t border-color flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Saving...' : 'Assign Salary'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function EmployeeSalary() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await getEmployeeSalaries();
            setAssignments(res.data.results || res.data || []);
        } catch (error) {
            console.error("Error fetching assignments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (assignment) => {
        setSelectedAssignment(assignment);
        setShowForm(true);
    };

    const handleSuccess = () => {
        fetchAssignments();
        setShowForm(false);
        setSelectedAssignment(null);
    };

    const filteredAssignments = assignments.filter(a =>
        a.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="employee-salary-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="text-brand" /> Employee Salary
                    </h1>
                    <p className="text-secondary">Assign salary structures and manage compensation</p>
                </div>
                <button onClick={() => { setSelectedAssignment(null); setShowForm(true); }} className="btn btn-primary">
                    <Plus size={18} /> Assign Salary
                </button>
            </div>

            <div className="toolbar-card">
                <div className="search-box">
                    <Search size={18} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="toolbar-input"
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading salary data...</p>
                </div>
            ) : (
                <div className="salary-table-container">
                    <table className="salary-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Designation</th>
                                <th>Structure</th>
                                <th>Basic Salary</th>
                                <th>Effective From</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssignments.map(assign => (
                                <tr key={assign.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar__initials">{assign.employee_name?.charAt(0)}</div>
                                            <div>
                                                <div className="font-bold">{assign.employee_name}</div>
                                                <div className="text-xs text-muted">{assign.employee_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{assign.designation || '-'}</td>
                                    <td>
                                        <span className="badge-structure">{(assign.salary_structure?.name || assign.salary_structure_name)}</span>
                                    </td>
                                    <td>
                                        <span className="font-mono font-medium">${assign.basic_amount?.toLocaleString()}</span>
                                    </td>
                                    <td>{assign.effective_from}</td>
                                    <td>
                                        {assign.is_current ? (
                                            <span className="status-badge active">Current</span>
                                        ) : (
                                            <span className="status-badge inactive">History</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <button onClick={() => handleEdit(assign)} className="btn-icon">
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredAssignments.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center p-8 text-muted">No salary assignments found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <SalaryAssignmentForm
                    assignment={selectedAssignment}
                    onClose={() => { setShowForm(false); setSelectedAssignment(null); }}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
