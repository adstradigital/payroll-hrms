'use client';

import { useState, useEffect } from 'react';
import { 
    FileText, Download, Calendar, Tag, Search, 
    Filter, AlertCircle, Loader2, File, 
    CheckCircle2, Clock, User
} from 'lucide-react';
import { getMyDocuments } from '@/api/api_clientadmin';
import './MyDocuments.css';

const DOCUMENT_TYPE_STYLING = {
    offer_letter: { icon: FileText, color: '#4f46e5', label: 'Offer Letter' },
    appointment_letter: { icon: CheckCircle2, color: '#10b981', label: 'Appointment Letter' },
    contract: { icon: File, color: '#f59e0b', label: 'Contract' },
    nda: { icon: Clock, color: '#6366f1', label: 'NDA' },
    resignation: { icon: AlertCircle, color: '#ef4444', label: 'Resignation' },
    experience_letter: { icon: Tag, color: '#8b5cf6', label: 'Experience Letter' },
    certificate: { icon: CheckCircle2, color: '#06b6d4', label: 'Certificate' },
    other: { icon: FileText, color: '#6b7280', label: 'Other' }
};

export default function MyDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await getMyDocuments();
            if (response.data.success) {
                setDocuments(response.data.documents || []);
            } else if (response.data.error_code === 'NO_EMPLOYEE_PROFILE') {
                setError('profile_missing');
            } else {
                setError(response.data.error || 'Failed to load documents');
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('An error occurred while fetching your documents.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (doc) => {
        if (!doc.document_file) return;
        
        // Construct clear filename
        const extension = doc.document_file.split('.').pop();
        const fileName = `${doc.title.replace(/\s+/g, '_')}_${doc.id.substring(0, 8)}.${extension}`;
        
        // Create temporary link for download
        const link = document.createElement('a');
        link.href = doc.document_file;
        link.setAttribute('download', fileName);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.document_type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || doc.document_type === filterType;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="docs-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Loading your documents...</p>
            </div>
        );
    }

    return (
        <div className="my-docs-container">
            <header className="docs-header">
                <div className="docs-header__title">
                    <h1>My Documents</h1>
                    <p>Access and download your official employment records</p>
                </div>
                
                <div className="docs-header__actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search documents..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-box">
                        <Filter size={18} />
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {Object.keys(DOCUMENT_TYPE_STYLING).map(type => (
                                <option key={type} value={type}>{DOCUMENT_TYPE_STYLING[type].label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {error ? (
                <div className="docs-error">
                    {error === 'profile_missing' ? (
                        <>
                            <User size={64} style={{ color: '#94a3b8', marginBottom: '1.5rem' }} />
                            <h3>No Employee Profile Found</h3>
                            <p>You are logged in as an administrator, but no employee record is linked to this account.<br /> Personal documents are only available for accounts with an active employee profile.</p>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={48} />
                            <h3>Oops! Something went wrong</h3>
                            <p>{error}</p>
                            <button onClick={fetchDocuments}>Try Again</button>
                        </>
                    )}
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="docs-empty">
                    <div className="docs-empty__icon">
                        <FileText size={64} />
                    </div>
                    <h3>No Documents Found</h3>
                    <p>{searchTerm || filterType !== 'all' ? 'Try adjusting your search or filters.' : 'No documents have been uploaded for you yet.'}</p>
                </div>
            ) : (
                <div className="docs-grid">
                    {filteredDocuments.map(doc => {
                        const style = DOCUMENT_TYPE_STYLING[doc.document_type] || DOCUMENT_TYPE_STYLING.other;
                        const Icon = style.icon;
                        
                        return (
                            <div key={doc.id} className="doc-card">
                                <div className="doc-card__type-indicator" style={{ backgroundColor: style.color }}>
                                    <Icon size={24} color="white" />
                                </div>
                                
                                <div className="doc-card__content">
                                    <div className="doc-card__info">
                                        <h3 title={doc.title}>{doc.title}</h3>
                                        <span className="doc-card__badge">{style.label}</span>
                                    </div>
                                    
                                    <div className="doc-card__meta">
                                        <div className="meta-item">
                                            <Calendar size={14} />
                                            <span>Issued: {doc.issue_date || 'N/A'}</span>
                                        </div>
                                        {doc.is_verified && (
                                            <div className="meta-item verified">
                                                <CheckCircle2 size={14} />
                                                <span>Verified</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="doc-card__description">{doc.description || 'No description provided.'}</p>
                                    
                                    <button 
                                        className="doc-card__download-btn"
                                        onClick={() => handleDownload(doc)}
                                    >
                                        <Download size={18} />
                                        Download File
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
