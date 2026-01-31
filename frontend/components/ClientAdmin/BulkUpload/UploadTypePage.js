'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Info } from 'lucide-react';
import * as bulkUploadApi from '@/api/bulkUploadApi';
import UploadForm from './UploadForm';
import './UploadTypePage.css';

export default function UploadTypePage({ type, title, description }) {
    const router = useRouter();
    const [recentUploads, setRecentUploads] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // In a real app, query history filtering by type
        // For mock, we just filter the dashboard stats data or reuse history mock
        fetchRecentUploads();
    }, [type]);

    const fetchRecentUploads = async () => {
        try {
            const data = await bulkUploadApi.getDashboardStats(); // reusing for mock simplicity
            setRecentUploads(data.recentUploads.filter(u => u.type === type));
        } catch (error) {
            console.error('Failed to load recent uploads', error);
        }
    };

    const handleUpload = async (file, skipErrors) => {
        setLoading(true);
        try {
            const result = await bulkUploadApi.uploadFile(type, file);
            // Redirect to confirm or detail page
            router.push(`/dashboard/payroll/bulk-upload/detail/${result.id}`);
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bu-type-page">
            <header className="bu-type-page__header">
                <button className="bu-back-btn" onClick={() => router.push('/dashboard/payroll/bulk-upload/dashboard')}>
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <div className="bu-header-content">
                    <div>
                        <h1>{title}</h1>
                        <p>{description}</p>
                    </div>
                    <button
                        className="bu-download-template-btn"
                        onClick={() => bulkUploadApi.downloadTemplate(type)}
                    >
                        <Download size={18} />
                        Download Template
                    </button>
                </div>
            </header>

            <div className="bu-layout-grid">
                <div className="bu-upload-section">
                    <UploadForm type={type} onUpload={handleUpload} loading={loading} />

                    <div className="bu-recent-type-uploads">
                        <h3>Recent {title} Uploads</h3>
                        <div className="bu-recent-list">
                            {recentUploads.length > 0 ? (
                                recentUploads.map(upload => (
                                    <div key={upload.id} className="bu-recent-item" onClick={() => router.push(`/dashboard/payroll/bulk-upload/detail/${upload.id}`)}>
                                        <div className="bu-recent-info">
                                            <span className="bu-recent-name">{upload.fileName}</span>
                                            <span className="bu-recent-date">{new Date(upload.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`bu-status-badge bu-status-${upload.status}`}>
                                            {upload.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="bu-empty-text">No recent uploads.</p>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="bu-info-sidebar">
                    <div className="bu-info-card">
                        <div className="bu-info-header">
                            <Info size={20} className="bu-info-icon" />
                            <h3>Instructions</h3>
                        </div>
                        <div className="bu-instructions">
                            <p>Follow these steps to ensure a smooth upload:</p>
                            <ol>
                                <li>Download the latest template.</li>
                                <li>Fill in your data. Ensure mandatory fields marked with (*) are filled.</li>
                                <li>Do not change the header row names.</li>
                                <li>Save file as CSV or Excel (xlsx).</li>
                                <li>Upload the file here.</li>
                            </ol>
                            <div className="bu-tip">
                                <strong>Tip:</strong> For date fields, use YYYY-MM-DD format to avoid parsing errors.
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
