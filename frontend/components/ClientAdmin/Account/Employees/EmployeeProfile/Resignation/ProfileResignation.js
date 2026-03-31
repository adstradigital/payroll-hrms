'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, AlertCircle, FileText,
    Clock, LogOut, Info, Download,
    CheckCircle2, AlertTriangle
} from 'lucide-react';
import { getEmployeeDocuments } from '@/api/api_clientadmin';
import './ProfileResignation.css';

export default function ProfileResignation({ employee }) {
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    useEffect(() => {
        if (employee?.id) {
            fetchResignationDocuments();
        }
    }, [employee?.id]);

    const fetchResignationDocuments = async () => {
        setLoadingDocs(true);
        try {
            const res = await getEmployeeDocuments(employee.id);
            // Filter for resignation documents
            const resignationDocs = (res.data || []).filter(
                doc => doc.document_type === 'resignation'
            );
            setDocuments(resignationDocs);
        } catch (err) {
            console.error('Error fetching resignation documents:', err);
        } finally {
            setLoadingDocs(false);
        }
    };

    if (!employee) return null;

    const isResigned = employee.status === 'resigned' || employee.resignation_date;
    const isTerminated = employee.status === 'terminated' || employee.termination_date;

    return (
        <div className="profile-resignation-container animate-fade-in">
            <div className="resignation-header">
                <div className="header-icon">
                    {isTerminated ? <AlertTriangle size={32} /> : <LogOut size={32} />}
                </div>
                <div className="header-text">
                    <h3 className="section-title">
                        {isTerminated ? 'Termination Details' : 'Resignation & Exit'}
                    </h3>
                    <p className="section-subtitle">
                        Tracking the employee's separation process and final settlement status.
                    </p>
                </div>
            </div>

            <div className="resignation-grid">
                {/* --- Key Dates --- */}
                <div className="resignation-card">
                    <div className="card-label"><Calendar size={16} /> Key Dates</div>
                    <div className="dates-list">
                        <div className="date-item">
                            <span className="date-label">Resignation Date:</span>
                            <span className="date-value">{employee.resignation_date || 'N/A'}</span>
                        </div>
                        <div className="date-item">
                            <span className="date-label">Last Working Date:</span>
                            <span className="date-value highlight">{employee.last_working_date || 'N/A'}</span>
                        </div>
                        <div className="date-item">
                            <span className="date-label">Termination Date:</span>
                            <span className="date-value">{employee.termination_date || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* --- Notice Period --- */}
                <div className="resignation-card">
                    <div className="card-label"><Clock size={16} /> Departure Info</div>
                    <div className="info-stats">
                        <div className="stat-box">
                            <span className="stat-num">{employee.notice_period_days || 0}</span>
                            <span className="stat-txt">Notice Days</span>
                        </div>
                        <div className="stat-box status">
                            <span className="stat-status-badge">{employee.status?.toUpperCase()}</span>
                            <span className="stat-txt">Current Status</span>
                        </div>
                    </div>
                </div>

                {/* --- Reason for Leaving --- */}
                <div className="resignation-card full-width">
                    <div className="card-label"><Info size={16} /> Reason for Separation</div>
                    <div className="reason-content">
                        {employee.termination_reason || employee.notes ? (
                            <p>{employee.termination_reason || employee.notes}</p>
                        ) : (
                            <div className="empty-reason">
                                <AlertCircle size={14} />
                                <span>No detailed reason provided in the profile records.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Exit Documents --- */}
                <div className="resignation-card full-width">
                    <div className="card-label"><FileText size={16} /> Exit Documents</div>
                    <div className="docs-list">
                        {loadingDocs ? (
                            <div className="doc-loading">Loading documents...</div>
                        ) : documents.length > 0 ? (
                            documents.map(doc => (
                                <div key={doc.id} className="doc-item">
                                    <div className="doc-meta">
                                        <FileText size={18} className="doc-icon" />
                                        <div>
                                            <div className="doc-title">{doc.title}</div>
                                            <div className="doc-date">Uploaded on {new Date(doc.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <a href={doc.document_file} target="_blank" rel="noopener noreferrer" className="download-btn">
                                        <Download size={16} />
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="empty-docs">
                                No resignation letters or exit documents found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Exit Checklist Placeholder */}
            {!isResigned && !isTerminated && (
                <div className="resignation-footer">
                    <div className="checklist-banner">
                        <CheckCircle2 size={20} />
                        <span>Employee is currently active. Access this tab to manage future exit processes and documentation.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
