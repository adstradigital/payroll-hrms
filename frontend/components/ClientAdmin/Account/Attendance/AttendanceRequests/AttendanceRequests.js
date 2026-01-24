'use client';

import { useState, useEffect } from 'react';
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
        employee: { name: 'Kiran Kishor', id: 'PEP00', avatar: 'KK' },
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
        employee: { name: 'Kiran Kishor', id: 'PEP00', avatar: 'KK' },
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
        employee: { name: 'Kiran Kishor', id: 'PEP00', avatar: 'KK' },
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
        employee: { name: 'Kiran Kishor', id: 'PEP00', avatar: 'KK' },
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
        employee: { name: 'Ankit Pokhrel', id: 'PEP05', avatar: 'AP' },
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
    const [activeTab, setActiveTab] = useState('Requested');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setIsFilterOpen(false);
                setIsActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSelectAll = () => {
        if (selectedItems.length === mockRequests.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(mockRequests.map(item => item.id));
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const filteredRequests = mockRequests.filter(req =>
        req.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employee.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="attendance-requests">
            {/* Toolbar */}
            <div className="ha-toolbar">
                <div className="ha-toolbar-left">
                    <h1 className="ha-title">Attendance Requests</h1>
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ha-toolbar-right">
                    <div className="dropdown-container">
                        <button
                            className={`tool-btn ${isFilterOpen ? 'active' : ''}`}
                            onClick={() => { setIsFilterOpen(!isFilterOpen); setIsActionsOpen(false); }}
                        >
                            <Filter size={16} /> Filter
                        </button>
                        {isFilterOpen && (
                            <div className="ha-dropdown">
                                <button className="ha-dropdown-item"><User size={14} /> By Employee</button>
                                <button className="ha-dropdown-item"><Clock size={14} /> By Status</button>
                                <button className="ha-dropdown-item"><Calendar size={14} /> By Date</button>
                                <div className="ha-dropdown-divider"></div>
                                <button className="ha-dropdown-item text-rose" onClick={() => setIsFilterOpen(false)}>Reset</button>
                            </div>
                        )}
                    </div>

                    <div className="dropdown-container">
                        <button
                            className={`tool-btn ${isActionsOpen ? 'active' : ''}`}
                            onClick={() => { setIsActionsOpen(!isActionsOpen); setIsFilterOpen(false); }}
                        >
                            Actions <ChevronDown size={14} />
                        </button>
                        {isActionsOpen && (
                            <div className="ha-dropdown">
                                <button className="ha-dropdown-item">Approve Selected</button>
                                <button className="ha-dropdown-item text-rose">Reject Selected</button>
                                <div className="ha-dropdown-divider"></div>
                                <button className="ha-dropdown-item">Batch Edit</button>
                            </div>
                        )}
                    </div>

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
                        className={`tab-btn ${activeTab === 'Requested' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Requested')}
                    >
                        Requested Attendances
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'All' ? 'active' : ''}`}
                        onClick={() => setActiveTab('All')}
                    >
                        All Attendances
                    </button>
                </div>

                {/* Table */}
                <div className="requests-table-wrapper">
                    {filteredRequests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No requests found matching your search.</div>
                    ) : (
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
                                {filteredRequests.map(req => (
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
                    )}
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
                onRequest={() => {
                    setIsModalOpen(false);
                    console.log("Attendance request submitted");
                }}
            />
        </div>
    );
}
