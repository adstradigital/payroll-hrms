import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2, AlertCircle, Upload, X, Trash2 } from 'lucide-react';
import { getEmployeeDocuments, uploadEmployeeDocument, deleteEmployeeDocument } from '@/api/api_clientadmin';
import './ProfileDocuments.css';

export default function ProfileDocuments({ employeeId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Upload State
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({ title: '', document_type: '', description: '', file: null });

    useEffect(() => {
        fetchDocuments();
    }, [employeeId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await getEmployeeDocuments(employeeId);
            setDocuments(res.data.documents || res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Failed to load documents');
            setLoading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            await deleteEmployeeDocument(employeeId, docId);
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (err) {
            console.error('Error deleting document:', err);
            alert('Failed to delete document');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setUploadForm({ ...uploadForm, file: e.target.files[0] });
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.file || !uploadForm.title || !uploadForm.document_type) {
            alert('Please fill all required fields');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('document_type', uploadForm.document_type);
            formData.append('description', uploadForm.description);
            formData.append('document_file', uploadForm.file);
            formData.append('employee', employeeId);

            await uploadEmployeeDocument(employeeId, formData);

            // Reset and refresh
            setShowModal(false);
            setUploadForm({ title: '', document_type: '', description: '', file: null });
            fetchDocuments();
        } catch (err) {
            console.error(err);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;
    if (error) return <div className="p-4 text-red-400 flex items-center gap-2"><AlertCircle size={18} /> {error}</div>;

    // --- Classification Logic ---
    const COMPANY_TYPES = ['Offer Letter', 'Contract', 'Payslip', 'Relieving Letter', 'Experience Letter', 'Bonafide Certificate', 'Salary Certificate', 'Employment Certificate'];
    const companyDocs = documents.filter(d => COMPANY_TYPES.includes(d.document_type));
    const personalDocs = documents.filter(d => !COMPANY_TYPES.includes(d.document_type));

    const renderDocGrid = (docs, emptyMsg) => (
        docs.length === 0 ? (
            <div className="empty-state-small">
                <FileText size={24} className="text-gray-500" />
                <p className="text-gray-500 text-sm mt-2">{emptyMsg}</p>
            </div>
        ) : (
            <div className="documents-grid">
                {docs.map((doc) => (
                    <div key={doc.id} className="document-card">
                        <div className="doc-icon-wrapper" style={{ background: COMPANY_TYPES.includes(doc.document_type) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 165, 0, 0.1)' }}>
                            <FileText size={24} className={COMPANY_TYPES.includes(doc.document_type) ? "text-blue-400" : "text-orange-400"} />
                        </div>
                        <div className="doc-info">
                            <h4 className="doc-title">{doc.title}</h4>
                            <span className="doc-meta">{doc.document_type}</span>
                            <span className="doc-date">{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="doc-actions">
                            <a
                                href={doc.document_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="doc-download-btn"
                                title="Download"
                            >
                                <Download size={16} />
                            </a>
                            <button
                                className="doc-delete-btn"
                                onClick={() => handleDelete(doc.id)}
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )
    );

    return (
        <div className="profile-documents animate-fade-in">
            <div className="docs-header-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className="text-lg font-semibold text-white">Documents Repository</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        <Upload size={16} /> Upload New
                    </button>
                </div>
            </div>

            <div className="doc-section">
                <h4 className="doc-section-title">Personal Records</h4>
                {renderDocGrid(personalDocs, "No personal documents uploaded.")}
            </div>

            <div className="doc-divider"></div>

            <div className="doc-section">
                <h4 className="doc-section-title">Company Issued</h4>
                {renderDocGrid(companyDocs, "No company documents issued yet.")}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content card slide-in-up">
                        <div className="modal-header">
                            <h3>Upload Document</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="upload-form">
                            <div className="form-group">
                                <label>Document Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={uploadForm.title}
                                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                    placeholder="e.g. Relieving Letter"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Document Type *</label>
                                <select
                                    className="form-input"
                                    value={uploadForm.document_type}
                                    onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <optgroup label="Personal">
                                        <option value="Resume">Resume</option>
                                        <option value="ID Proof">ID Proof</option>
                                        <option value="Education Certificate">Education Certificate</option>
                                        <option value="Address Proof">Address Proof</option>
                                        <option value="Other">Other</option>
                                    </optgroup>
                                    <optgroup label="Company Issued">
                                        <option value="Offer Letter">Offer Letter</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Payslip">Payslip</option>
                                        <option value="Relieving Letter">Relieving Letter</option>
                                        <option value="Experience Letter">Experience Letter</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>File *</label>
                                <div className="file-input-wrapper">
                                    <input type="file" onChange={handleFileChange} required />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
