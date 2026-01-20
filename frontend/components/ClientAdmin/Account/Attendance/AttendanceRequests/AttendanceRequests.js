'use client';

import { useState } from 'react';
import {
    Search, Filter, Plus, MoreVertical, X, Calendar,
    Clock, User, CheckCircle, XCircle, ChevronDown,
    Eye, Trash2, Edit2, LayoutGrid, List
} from 'lucide-react';
import CreateAttendanceModal from './CreateAttendanceModal';
import './AttendanceRequests.css';
import '../Attendance.css'; // Inherit shared styles

const mockRequests = [
    {
        id: 1,
        employee: { name: 'Adam Luis', id: 'PEP00', avatar: 'AL' },
        batch: 'None',
        date: '21/01/2026',
        day: 'Wednesday',
        checkIn: '08:30',
        inDate: '21/01/2026',
        checkOut: '12:49',
        status: 'pending'
    },
    {
        id: 2,
        employee: { name: 'Adam Luis', id: 'PEP00', avatar: 'AL' },
        batch: 'None',
        date: '20/01/2026',
        day: 'Tuesday',
        checkIn: '00:53',
        inDate: '20/01/2026',
        checkOut: 'None',
        status: 'pending'
    },
    {
        id: 3,
        employee: { name: 'Adam Luis', id: 'PEP00', avatar: 'AL' },
        batch: 'None',
        date: '19/01/2026',
        day: 'Monday',
        checkIn: '07:45',
        inDate: '19/01/2026',
        checkOut: 'None',
        status: 'pending'
    },
    {
        id: 4,
        employee: { name: 'Adam Luis', id: 'PEP00', avatar: 'AL' },
        batch: 'None',
        date: '18/01/2026',
        day: 'Sunday',
        checkIn: '14:26',
        inDate: '18/01/2026',
        checkOut: 'None',
        status: 'pending'
    },
    {
        id: 5,
        employee: { name: 'ANKIT POKHREL', id: 'PEP0003', avatar: 'AP' },
        batch: 'teste-3',
        date: '17/01/2026',
        day: 'Saturday',
        checkIn: '04:01',
        inDate: '17/01/2026',
        checkOut: '03:00',
        status: 'approved'
    }
];

export default function AttendanceRequests() {
    const [activeTab, setActiveTab] = useState('requested');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    const toggleSelectAll = () => {
        if (selectedItems.length === mockRequests.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(mockRequests.map(r => r.id));
        }
    };

    const toggleSelectItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    return (
        <div className="attendance-requests">
            {/* Header Toolbar */}
            <div className="requests-toolbar">
                <div className="toolbar-left">
                    <h1 className="toolbar-title">Attendances</h1>
                </div>

                <div className="toolbar-right">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button className="tool-btn">
                        <Filter size={16} /> Filter
                    </button>

                    <button className="tool-btn">
                        <LayoutGrid size={16} /> Group By
                    </button>

                    <button className="tool-btn">
                        Actions <ChevronDown size={14} />
                    </button>

                    <button className="create-btn" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Create
                    </button>
                </div>
            </div>

            {/* Status Legend */}
            <div className="status-summary">
                <div className="status-dot-item">
                    <span className="status-dot green"></span> Validated
                </div>
                <div className="status-dot-item">
                    <span className="status-dot gray"></span> Not-Validated
                </div>
                <div className="status-dot-item">
                    <span className="status-dot blue"></span> Bulk-Requests
                </div>
            </div>

            {/* Main Content Card */}
            <div className="requests-container">
                {/* Tabs */}
                <div className="tabs-header">
                    <button
                        className={`tab-btn ${activeTab === 'requested' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requested')}
                    >
                        Requested Attendances
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Attendances
                    </button>
                </div>

                {/* Table */}
                <div className="requests-table-wrapper">
                    <table className="request-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === mockRequests.length}
                                        onChange={toggleSelectAll}
                                        className="checkbox-custom"
                                    />
                                </th>
                                <th>Employee</th>
                                <th>Batch</th>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Check-In</th>
                                <th>In Date</th>
                                <th>Check-Out</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockRequests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(req.id)}
                                            onChange={() => toggleSelectItem(req.id)}
                                            className="checkbox-custom"
                                        />
                                    </td>
                                    <td>
                                        <div className="employee-cell">
                                            <div className="employee-avatar-md">{req.employee.avatar}</div>
                                            <div>
                                                <div className="font-bold">{req.employee.name}</div>
                                                <div className="text-xs text-muted">({req.employee.id})</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {req.batch !== 'None' ? (
                                            <span className="batch-badge">{req.batch}</span>
                                        ) : 'None'}
                                    </td>
                                    <td>{req.date}</td>
                                    <td>{req.day}</td>
                                    <td className="font-mono">{req.checkIn}</td>
                                    <td>{req.inDate}</td>
                                    <td className="font-mono">{req.checkOut}</td>
                                    <td>
                                        <div className="action-btn-group">
                                            <button className="icon-btn edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="icon-btn reject">
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Visual only) */}
                <div className="pagination p-4 border-t border-border">
                    <span>Page 1 of 1.</span>
                    <div className="pagination-btns">
                        <button disabled>‹</button>
                        <button>1</button>
                        <button disabled>›</button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <CreateAttendanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
