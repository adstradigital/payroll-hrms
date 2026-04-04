'use client';

import { useState, useEffect } from 'react';
import {
    Clock, User, Tag, ArrowRight,
    History, Search, Filter, Box,
    ChevronRight, AlertCircle, CheckCircle2, CircleSlash
} from 'lucide-react';
import { getAssetHistory } from '@/api/api_clientadmin';
import './AssetHistory.css';

export default function AssetHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        fetchHistory();
    }, [searchTerm, typeFilter]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const params = {
                search: searchTerm,
                history_type: typeFilter !== 'all' ? typeFilter : undefined
            };
            const response = await getAssetHistory(params);
            setHistory(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="asset-history">
            {/* Filter Toolbar */}
            <div className="ah-toolbar">
                <div className="ah-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by asset or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ah-filter-group">
                    <Filter size={18} />
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="all">All Activities</option>
                        <option value="assignment">Assignments</option>
                        <option value="status">Status Changes</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="addition">New Additions</option>
                    </select>
                </div>
            </div>

            {/* Timeline View */}
            <div className="ah-timeline-container">
                <div className="ah-timeline">
                    {history.map((event, index) => {
                        return (
                            <div key={event.id} className="ah-timeline-item">
                                <div className="ah-timeline-marker">
                                    <div className={`ah-marker-dot marker--${event.history_type}`}></div>
                                    {index !== history.length - 1 && <div className="ah-marker-line"></div>}
                                </div>
                                <div className="ah-timeline-content">
                                    <div className="ah-event-header">
                                        <div className="ah-event-main">
                                            <span className="ah-event-date">{new Date(event.date).toLocaleString()}</span>
                                            <h4 className="ah-event-action">{event.action}</h4>
                                        </div>
                                        <div className={`ah-event-tag tag--${event.history_type}`}>
                                            {event.history_type.replace('-', ' ')}
                                        </div>
                                    </div>
                                    <div className="ah-event-body">
                                        <div className="ah-asset-card">
                                            <div className="ah-asset-main">
                                                <div className="ah-asset-icon">
                                                    <Box size={20} />
                                                </div>
                                                <div className="ah-asset-info">
                                                    <span className="ah-asset-id">{event.asset_details?.asset_id || 'N/A'}</span>
                                                    <h5 className="ah-asset-name">{event.asset_details?.name || 'Unknown Asset'}</h5>
                                                </div>
                                            </div>
                                            {event.asset_details && (
                                                <div className="ah-asset-meta">
                                                    <span><strong>SN:</strong> {event.asset_details.serial_number || '-'}</span>
                                                    <span><strong>Model:</strong> {event.asset_details.model || '-'}</span>
                                                    <span className="ah-category-tag">{event.asset_details.category}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="ah-event-footer">
                                            <div className="ah-user-info">
                                                <div className="ah-user-avatar">
                                                    {event.user_details?.full_name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="ah-user-text">
                                                    <span className="ah-user-label">Performer</span>
                                                    <span className="ah-user-name">{event.user_details?.full_name || 'System Auto'}</span>
                                                </div>
                                            </div>
                                            <CircleSlash size={14} className="ah-footer-sep" />
                                            <p className="ah-event-desc">{event.details}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
