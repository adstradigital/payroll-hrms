'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Info } from 'lucide-react';
import * as bulkUploadApi from '@/api/bulkUploadApi';
import UploadForm from './UploadForm';
import UploadHistory from './UploadHistory';
import './UploadTypePage.css';

export default function UploadTypePage({ type, title, description }) {
    const router = useRouter();
    const [historyKey, setHistoryKey] = useState(0); // Used to refresh history component
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    const handleUpload = async (file, skipErrors) => {
        setLoading(true);
        setProgress(0);
        setStatusMessage('Initializing upload...');
        
        try {
            const result = await bulkUploadApi.uploadFile(
                type, 
                file, 
                (p, msg) => {
                    setProgress(p);
                    setStatusMessage(msg);
                },
                skipErrors
            );
            
            if (result.status === 'failed') {
                const errorMsg = result.errors && result.errors.length > 0 ? result.errors[0].error : 'Unknown error';
                alert(`Upload completely failed. Reason: ${errorMsg}`);
            } else if (result.status === 'partial') {
                alert(`Upload finished with warnings. ${result.successCount || result.successRows} imported, ${result.failedCount || result.errorRows} failed. See history details for specific row errors.`);
            } else {
                alert(`Upload successful! ${result.successCount || result.successRows} rows imported.`);
            }

            // Refresh history table instead of redirecting
            setHistoryKey(prev => prev + 1);
            setStatusMessage('');
            setProgress(0);
        } catch (error) {
            alert('Upload halted unexpectedly: ' + error.message);
            setStatusMessage('Error: ' + error.message);
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
                    
                    {loading && (
                        <div className="bu-upload-progress">
                            <div className="bu-progress-bar">
                                <div className="bu-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="bu-progress-text">{statusMessage}</p>
                        </div>
                    )}
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

            <div className="bu-history-section">
                <UploadHistory key={historyKey} type={type} isEmbedded={true} />
            </div>
        </div>
    );
}
