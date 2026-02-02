'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Download, Eye, FileText } from 'lucide-react';
import * as bulkUploadApi from '@/api/bulkUploadApi';
import './UploadHistory.css';

export default function UploadHistory() {
    const router = useRouter();
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchHistory();
    }, [filterStatus, searchQuery]); // In real app, might want to debounce search

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await bulkUploadApi.getUploadHistory({ status: filterStatus, search: searchQuery });
            setUploads(data);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchHistory();
    };

    const statusOptions = [
        { id: 'all', label: 'All Uploads' },
        { id: 'completed', label: 'Completed' },
        { id: 'processing', label: 'Processing' },
        { id: 'failed', label: 'Failed' },
        { id: 'partial', label: 'Partial' },
    ];

    return (
        <div className="bu-history">
            <header className="bu-history__header">
                <div>
                    <h1>Upload History</h1>
                    <p>Track and manage your past bulk data uploads</p>
                </div>
                <button className="bu-export-btn">
                    <Download size={18} />
                    Export to Excel
                </button>
            </header>

            <div className="bu-history__controls">
                <div className="bu-tabs">
                    {statusOptions.map(option => (
                        <button
                            key={option.id}
                            className={`bu-tab ${filterStatus === option.id ? 'bu-tab--active' : ''}`}
                            onClick={() => setFilterStatus(option.id)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <form className="bu-search-form" onSubmit={handleSearch}>
                    <Search size={18} className="bu-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by ID or filename..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            <div className="bu-history__table-container">
                <table className="bu-history-table">
                    <thead>
                        <tr>
                            <th>Upload ID</th>
                            <th>Type</th>
                            <th>File Name</th>
                            <th>Status</th>
                            <th>Rows</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="bu-loading-cell">
                                    <div className="spinner-small"></div> Loading history...
                                </td>
                            </tr>
                        ) : uploads.length > 0 ? (
                            uploads.map(upload => (
                                <tr key={upload.id}>
                                    <td className="bu-id-cell">{upload.id}</td>
                                    <td>
                                        <span className="bu-type-tag">{upload.type}</span>
                                    </td>
                                    <td className="bu-filename-cell">
                                        <FileText size={16} />
                                        {upload.fileName}
                                    </td>
                                    <td>
                                        <span className={`bu-status-badge bu-status-${upload.status}`}>
                                            {upload.status}
                                        </span>
                                    </td>
                                    <td>{upload.rows}</td>
                                    <td>{new Date(upload.date).toLocaleDateString()} {new Date(upload.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>
                                        <button
                                            className="bu-action-icon-btn"
                                            onClick={() => router.push(`/dashboard/payroll/bulk-upload/detail/${upload.id}`)}
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="bu-empty-cell">No uploads found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
