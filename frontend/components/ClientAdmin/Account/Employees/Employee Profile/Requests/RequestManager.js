import React, { useState } from 'react';
import { FileText, Clock, Briefcase, Plus, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createDocumentRequest, createShiftRequest, createWorkTypeRequest } from '@/api/api_clientadmin';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import './RequestManager.css';

export default function RequestManager({ employeeId, onClose }) {
    const [activeRequestTab, setActiveRequestTab] = useState('document');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Form States
    const [docForm, setDocForm] = useState({ document_type: '', reason: '' });
    const [shiftForm, setShiftForm] = useState({ current_shift: '', requested_shift: '', reason: '', effective_date: '' });
    const [workTypeForm, setWorkTypeForm] = useState({ current_type: '', requested_type: 'Remote', reason: '', effective_date: '' });

    const resetForms = () => {
        setDocForm({ document_type: '', reason: '' });
        setShiftForm({ current_shift: '', requested_shift: '', reason: '', effective_date: '' });
        setWorkTypeForm({ current_type: '', requested_type: 'Remote', reason: '', effective_date: '' });
        setSuccess(null);
        setError(null);
    };

    const handleTabChange = (tab) => {
        setActiveRequestTab(tab);
        resetForms();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            let response;
            const dataPayload = { employee: employeeId }; // In case backend needs it explicitly, though usually inferred from context or URL

            if (activeRequestTab === 'document') {
                if (!docForm.document_type || !docForm.reason) throw new Error("Please fill all fields");
                // Set direction to employee_to_admin for requests from employee profile
                response = await createDocumentRequest({ ...dataPayload, ...docForm, direction: 'employee_to_admin' });
            } else if (activeRequestTab === 'shift') {
                if (!shiftForm.current_shift || !shiftForm.requested_shift || !shiftForm.effective_date) throw new Error("Please fill all fields");
                response = await createShiftRequest({ ...dataPayload, ...shiftForm });
            } else if (activeRequestTab === 'work-type') {
                if (!workTypeForm.current_type || !workTypeForm.requested_type || !workTypeForm.effective_date) throw new Error("Please fill all fields");
                response = await createWorkTypeRequest({ ...dataPayload, ...workTypeForm });
            }

            if (response && (response.status === 200 || response.status === 201)) {
                setSuccess('Request submitted successfully!');
                setTimeout(() => setSuccess(null), 3000);
                // Optionally clear form here or keep it
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="request-manager-container animate-fade-in">
            <div className="request-tabs">
                <button
                    className={`req-tab-btn ${activeRequestTab === 'document' ? 'active' : ''}`}
                    onClick={() => handleTabChange('document')}
                >
                    <FileText size={16} /> Document Request
                </button>
                <button
                    className={`req-tab-btn ${activeRequestTab === 'shift' ? 'active' : ''}`}
                    onClick={() => handleTabChange('shift')}
                >
                    <Clock size={16} /> Shift Change
                </button>
                <button
                    className={`req-tab-btn ${activeRequestTab === 'work-type' ? 'active' : ''}`}
                    onClick={() => handleTabChange('work-type')}
                >
                    <Briefcase size={16} /> Work Type
                </button>
            </div>

            <div className="request-form-area card shadow-sm">
                <h3 className="form-title">
                    {activeRequestTab === 'document' && 'Request a Document'}
                    {activeRequestTab === 'shift' && 'Request Shift Change'}
                    {activeRequestTab === 'work-type' && 'Request Work Type Change'}
                </h3>

                {success && (
                    <div className="alert alert-success">
                        <CheckCircle2 size={18} /> {success}
                    </div>
                )}

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="request-form">
                    {activeRequestTab === 'document' && (
                        <>
                            <div className="form-group">
                                <label>Document Type</label>
                                <select
                                    value={docForm.document_type}
                                    onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })}
                                    className="form-input"
                                    required
                                >
                                    <option value="">Select Document Type</option>
                                    <option value="Salary Slip">Salary Slip</option>
                                    <option value="Employment Certificate">Employment Certificate</option>
                                    <option value="Relieving Letter">Relieving Letter</option>
                                    <option value="Address Proof">Address Proof</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Reason / Details</label>
                                <textarea
                                    value={docForm.reason}
                                    onChange={(e) => setDocForm({ ...docForm, reason: e.target.value })}
                                    className="form-input"
                                    placeholder="Why do you need this document?"
                                    rows={3}
                                    required
                                />
                            </div>
                        </>
                    )}

                    {activeRequestTab === 'shift' && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Current Shift</label>
                                    <input
                                        type="text"
                                        value={shiftForm.current_shift}
                                        onChange={(e) => setShiftForm({ ...shiftForm, current_shift: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g. 9AM - 6PM"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Requested Shift</label>
                                    <input
                                        type="text"
                                        value={shiftForm.requested_shift}
                                        onChange={(e) => setShiftForm({ ...shiftForm, requested_shift: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g. 10AM - 7PM"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Effective Date</label>
                                <input
                                    type="date"
                                    value={shiftForm.effective_date}
                                    onChange={(e) => setShiftForm({ ...shiftForm, effective_date: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea
                                    value={shiftForm.reason}
                                    onChange={(e) => setShiftForm({ ...shiftForm, reason: e.target.value })}
                                    className="form-input"
                                    placeholder="Reason for change"
                                    rows={2}
                                />
                            </div>
                        </>
                    )}

                    {activeRequestTab === 'work-type' && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Current Work Type</label>
                                    <select
                                        value={workTypeForm.current_type}
                                        onChange={(e) => setWorkTypeForm({ ...workTypeForm, current_type: e.target.value })}
                                        className="form-input"
                                        required
                                    >
                                        <option value="">Select Current Type</option>
                                        <option value="On-Site">On-Site</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Requested Work Type</label>
                                    <select
                                        value={workTypeForm.requested_type}
                                        onChange={(e) => setWorkTypeForm({ ...workTypeForm, requested_type: e.target.value })}
                                        className="form-input"
                                        required
                                    >
                                        <option value="On-Site">On-Site</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Effective Date</label>
                                <input
                                    type="date"
                                    value={workTypeForm.effective_date}
                                    onChange={(e) => setWorkTypeForm({ ...workTypeForm, effective_date: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <textarea
                                    value={workTypeForm.reason}
                                    onChange={(e) => setWorkTypeForm({ ...workTypeForm, reason: e.target.value })}
                                    className="form-input"
                                    placeholder="Justification"
                                    rows={2}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="form-actions right">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
