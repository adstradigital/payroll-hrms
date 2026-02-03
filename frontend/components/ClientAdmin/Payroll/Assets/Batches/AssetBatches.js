'use client';

import { useState } from 'react';
import {
    Plus, Search, Package, Calendar,
    CheckCircle, Clock, AlertCircle,
    ChevronDown, MoreVertical, LayoutGrid,
    List
} from 'lucide-react';
import './AssetBatches.css';

const initialBatches = [
    { id: 'BAT-2023-001', name: 'New Joiners Laptop Batch', type: 'Purchase', items: 15, date: '2023-10-15', status: 'completed', vendor: 'Apple India' },
    { id: 'BAT-2023-002', name: 'Marketing Tablet Upgrade', type: 'Upgrade', items: 8, date: '2023-11-02', status: 'in-progress', vendor: 'Reliance Digital' },
    { id: 'BAT-2023-003', name: 'Development Peripherals', type: 'Purchase', items: 25, date: '2023-11-20', status: 'pending', vendor: 'Amazon Business' },
    { id: 'BAT-2023-004', name: 'Annual IT Maintenance', type: 'Maintenance', items: 50, date: '2023-12-05', status: 'planned', vendor: 'Dell Services' },
];

export default function AssetBatches() {
    const [batches, setBatches] = useState(initialBatches);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

    return (
        <div className="asset-batches">
            {/* Header / Stats */}
            <div className="ab-header-stats">
                <div className="ab-stat-box">
                    <span className="ab-stat-label">Total Batches</span>
                    <span className="ab-stat-value">42</span>
                </div>
                <div className="ab-stat-box">
                    <span className="ab-stat-label">Active Items</span>
                    <span className="ab-stat-value">184</span>
                </div>
                <div className="ab-stat-box">
                    <span className="ab-stat-label">In-Progress</span>
                    <span className="ab-stat-value">3</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="ab-toolbar">
                <div className="ab-search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Search batches by name, ID or vendor..." />
                </div>
                <div className="ab-actions">
                    <div className="ab-view-toggle">
                        <button
                            className={`ab-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <List size={18} />
                        </button>
                        <button
                            className={`ab-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                    <button className="ab-btn ab-btn--primary">
                        <Plus size={18} /> New Batch
                    </button>
                </div>
            </div>

            {/* Batch Table */}
            <div className="ab-table-container">
                <table className="ab-table">
                    <thead>
                        <tr>
                            <th>Batch ID</th>
                            <th>Batch Name</th>
                            <th>Type</th>
                            <th>Items</th>
                            <th>Created Date</th>
                            <th>Status</th>
                            <th>Vendor</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map((batch) => (
                            <tr key={batch.id}>
                                <td className="ab-td-id">{batch.id}</td>
                                <td className="ab-td-name">
                                    <div className="ab-name-wrapper">
                                        <Package size={16} className="ab-pkg-icon" />
                                        <span>{batch.name}</span>
                                    </div>
                                </td>
                                <td><span className="ab-type-tag">{batch.type}</span></td>
                                <td>{batch.items} Units</td>
                                <td>{batch.date}</td>
                                <td>
                                    <span className={`ab-status-label ab-status-label--${batch.status}`}>
                                        {batch.status.replace('-', ' ')}
                                    </span>
                                </td>
                                <td>{batch.vendor}</td>
                                <td>
                                    <button className="ab-action-icon"><MoreVertical size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
