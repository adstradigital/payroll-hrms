'use client';

import { useState } from 'react';
import {
    Clock, User, Tag, ArrowRight,
    History, Search, Filter, Box,
    ChevronRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import './AssetHistory.css';

const historyData = [
    { id: 1, action: 'Allocation', asset: 'MacBook Pro M2', user: 'Anil Kumar', date: '2023-11-20 10:30 AM', details: 'Assigned by Admin', type: 'assignment' },
    { id: 2, action: 'Status Change', asset: 'Dell UltraSharp', user: 'System', date: '2023-11-19 02:15 PM', details: 'Status changed from Allocated to Available', type: 'status' },
    { id: 3, action: 'Request Approved', asset: 'MacBook Pro M2', user: 'Admin', date: '2023-11-19 11:00 AM', details: 'Request REQ-001 approved', type: 'approval' },
    { id: 4, action: 'Maintenance Start', asset: 'HP LaserJet Pro', user: 'IT Support', date: '2023-11-18 04:30 PM', details: 'Routine servicing started', type: 'maintenance' },
    { id: 5, action: 'Check-in', asset: 'iPhone 13', user: 'Rahul Singh', date: '2023-11-18 09:00 AM', details: 'Asset returned by user', type: 'check-in' },
    { id: 6, action: 'New Asset Added', asset: 'MacBook Pro M2', user: 'Admin', date: '2023-11-15 03:00 PM', details: 'Added to inventory (BAT-2023-001)', type: 'addition' },
];

export default function AssetHistory() {
    return (
        <div className="asset-history">
            {/* Filter Toolbar */}
            <div className="ah-toolbar">
                <div className="ah-search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Search by asset or user..." />
                </div>
                <div className="ah-filter-group">
                    <Filter size={18} />
                    <select>
                        <option>All Activities</option>
                        <option>Assignments</option>
                        <option>Status Changes</option>
                        <option>Maintenance</option>
                    </select>
                </div>
            </div>

            {/* Timeline View */}
            <div className="ah-timeline-container">
                <div className="ah-timeline">
                    {historyData.map((event, index) => {
                        return (
                            <div key={event.id} className="ah-timeline-item">
                                <div className="ah-timeline-marker">
                                    <div className={`ah-marker-dot marker--${event.type}`}></div>
                                    {index !== historyData.length - 1 && <div className="ah-marker-line"></div>}
                                </div>
                                <div className="ah-timeline-content">
                                    <div className="ah-event-header">
                                        <div className="ah-event-main">
                                            <span className="ah-event-date">{event.date}</span>
                                            <h4 className="ah-event-action">{event.action}</h4>
                                        </div>
                                        <div className={`ah-event-tag tag--${event.type}`}>
                                            {event.type.replace('-', ' ')}
                                        </div>
                                    </div>
                                    <div className="ah-event-body">
                                        <div className="ah-asset-pill">
                                            <Box size={14} />
                                            <span>{event.asset}</span>
                                        </div>
                                        <ArrowRight size={14} className="ah-arrow" />
                                        <div className="ah-user-pill">
                                            <User size={14} />
                                            <span>{event.user}</span>
                                        </div>
                                    </div>
                                    <p className="ah-event-details">{event.details}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
