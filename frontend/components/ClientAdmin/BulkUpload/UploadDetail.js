'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Download, ChevronDown, ChevronRight } from 'lucide-react';
import * as bulkUploadApi from '@/api/bulkUploadApi';
import './UploadDetail.css';

export default function UploadDetail({ id }) {
    const router = useRouter();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const data = await bulkUploadApi.getUploadDetail(id);
            setDetail(data);
        } catch (error) {
            console.error('Failed to load detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (index) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    if (loading) return <div className="bu-detail__loading"><div className="spinner"></div></div>;
    if (!detail) return <div className="bu-detail__error">Upload not found</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'failed': return '#ef4444';
            case 'processing': return '#3b82f6';
            case 'partial': return '#f59e0b';
            default: return 'var(--text-secondary)';
        }
    };

    const StatusIcon = detail.status === 'completed' ? CheckCircle2 :
        detail.status === 'failed' ? XCircle : AlertTriangle;

    return (
        <div className="bu-detail">
            <header className="bu-detail__header-nav">
                <button className="bu-back-btn" onClick={() => router.push('/dashboard/payroll/bulk-upload/history')}>
                    <ArrowLeft size={20} />
                    Back to History
                </button>
            </header>

            <div className="bu-detail__banner" style={{ borderColor: getStatusColor(detail.status) }}>
                <div className="bu-banner-content">
                    <div className="bu-banner-icon" style={{ color: getStatusColor(detail.status) }}>
                        <StatusIcon size={32} />
                    </div>
                    <div>
                        <h1>{detail.type} Upload: {detail.fileName}</h1>
                        <div className="bu-banner-meta">
                            <span>Upload ID: {detail.id}</span>
                            <span>•</span>
                            <span>{new Date(detail.startedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className={`bu-status-tag bu-status-${detail.status}`}>
                    {detail.status}
                </div>
            </div>

            <div className="bu-detail__stats-grid">
                <div className="bu-stat-box">
                    <h3>Total Rows</h3>
                    <p>{detail.totalRows}</p>
                </div>
                <div className="bu-stat-box bu-stat-success">
                    <h3>Successful</h3>
                    <p>{detail.successRows}</p>
                </div>
                <div className="bu-stat-box bu-stat-error">
                    <h3>Errors</h3>
                    <p>{detail.errorRows}</p>
                </div>
            </div>

            {/* Error Report Section */}
            {detail.errors && detail.errors.length > 0 && (
                <section className="bu-detail__errors">
                    <div className="bu-errors-header">
                        <h2>Error Report</h2>
                        <button className="bu-download-report-btn">
                            <Download size={16} /> Download Report
                        </button>
                    </div>

                    <div className="bu-errors-table-container">
                        <table className="bu-errors-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}></th>
                                    <th>Row #</th>
                                    <th>Column</th>
                                    <th>Error Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.errors.map((error, index) => (
                                    <>
                                        <tr key={index} className="bu-error-row" onClick={() => toggleRow(index)}>
                                            <td>
                                                {expandedRows[index] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </td>
                                            <td>{error.row}</td>
                                            <td>{error.column}</td>
                                            <td className="bu-error-msg">{error.message}</td>
                                        </tr>
                                        {expandedRows[index] && (
                                            <tr className="bu-error-detail-row">
                                                <td colSpan="4">
                                                    <div className="bu-error-raw-data">
                                                        <strong>Failed Value:</strong> <code>{error.data}</code>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
