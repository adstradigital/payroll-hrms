'use client';

import { useState, useEffect } from 'react';
import {
    Search, Filter, LayoutGrid, Plus,
    ChevronDown, Minus, Edit3, Trash2, X,
    ChevronRight, SlidersHorizontal, Calendar, User, Clock
} from 'lucide-react';
import './HourAccount.css';
import '../Attendance.css';

// Reusable Modal Component
import HourAccountModal from './HourAccountModal';

const mockData = {
    "January": [
        { id: 1, name: "Priya Sharma", month: "January", year: "2026", worked: "03:00", pending: "00:00", overtime: "02:00", avatar: "PS" },
        { id: 2, name: "Kiran Kishor", month: "January", year: "2026", worked: "16:40", pending: "32:35", overtime: "03:00", avatar: "KK" },
        { id: 3, name: "Jagathu", month: "January", year: "2026", worked: "00:00", pending: "00:00", overtime: "00:00", avatar: "JG" },
        { id: 4, name: "Afsal", month: "January", year: "2026", worked: "00:00", pending: "00:00", overtime: "00:00", avatar: "AF" },
        { id: 5, name: "Rahul Verma", month: "January", year: "2026", worked: "00:00", pending: "08:15", overtime: "00:00", avatar: "RV" },
        { id: 6, name: "Ankit Pokhrel", month: "January", year: "2026", worked: "08:15", pending: "00:00", overtime: "00:00", avatar: "AP" }
    ]
};

export default function HourAccount() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const [isGroupOpen, setIsGroupOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({ "January": true });
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setIsFilterOpen(false);
                setIsActionsOpen(false);
                setIsGroupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const toggleRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const selectAllRecords = () => {
        const allIds = Object.values(mockData).flat().map(row => row.id);
        if (selectedRows.length === allIds.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(allIds);
        }
    };

    const handleSave = () => {
        setIsCreateModalOpen(false);
        // In a real app, this would be an API call
        console.log("New hour account record requested");
    };

    // Filter data based on search
    const filteredData = Object.entries(mockData).reduce((acc, [groupName, rows]) => {
        const filteredRows = rows.filter(row =>
            row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.year.includes(searchQuery)
        );
        if (filteredRows.length > 0) {
            acc[groupName] = filteredRows;
        }
        return acc;
    }, {});

    return (
        <div className="hour-account-section">
            {/* Toolbar */}
            <div className="ha-toolbar">
                <div className="ha-toolbar-left">
                    <h1 className="ha-title">Hour Account</h1>
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ha-toolbar-right">
                    <div className="dropdown-container">
                        <button
                            className={`tool-btn ${isFilterOpen ? 'active' : ''}`}
                            onClick={() => { setIsFilterOpen(!isFilterOpen); setIsActionsOpen(false); setIsGroupOpen(false); }}
                        >
                            <Filter size={16} /> Filter
                        </button>
                        {isFilterOpen && (
                            <div className="ha-dropdown">
                                <button className="ha-dropdown-item"><Calendar size={14} /> By Month</button>
                                <button className="ha-dropdown-item"><User size={14} /> By Employee</button>
                                <button className="ha-dropdown-item"><Clock size={14} /> By Overtime</button>
                                <div className="ha-dropdown-divider"></div>
                                <button className="ha-dropdown-item text-rose" onClick={() => setIsFilterOpen(false)}>Close</button>
                            </div>
                        )}
                    </div>

                    <div className="dropdown-container">
                        <button
                            className={`tool-btn ${isGroupOpen ? 'active' : ''}`}
                            onClick={() => { setIsGroupOpen(!isGroupOpen); setIsFilterOpen(false); setIsActionsOpen(false); }}
                        >
                            <LayoutGrid size={16} /> Group By
                        </button>
                        {isGroupOpen && (
                            <div className="ha-dropdown">
                                <button className="ha-dropdown-item">None</button>
                                <button className="ha-dropdown-item">Month</button>
                                <button className="ha-dropdown-item">Year</button>
                                <button className="ha-dropdown-item">Employee</button>
                            </div>
                        )}
                    </div>

                    <div className="dropdown-container">
                        <button
                            className={`tool-btn ${isActionsOpen ? 'active' : ''}`}
                            onClick={() => { setIsActionsOpen(!isActionsOpen); setIsFilterOpen(false); setIsGroupOpen(false); }}
                        >
                            Actions <ChevronDown size={14} />
                        </button>
                        {isActionsOpen && (
                            <div className="ha-dropdown">
                                <button className="ha-dropdown-item"><Edit3 size={14} /> Batch Edit</button>
                                <button className="ha-dropdown-item text-rose"><Trash2 size={14} /> Delete Selected</button>
                                <div className="ha-dropdown-divider"></div>
                                <button className="ha-dropdown-item">Export PDF</button>
                                <button className="ha-dropdown-item">Export Excel</button>
                            </div>
                        )}
                    </div>

                    <button className="create-btn" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} /> Create
                    </button>
                </div>
            </div>

            {/* Filter Tags */}
            <div className="filter-tags-bar">
                <div className="filters-label">Filters:</div>
                <div className="filter-tag">
                    <b>Field</b> : Month
                    <button className="remove-tag-btn"><X size={10} /></button>
                </div>
                <div className="filter-tag">
                    <b>Year</b> : 2026
                    <button className="remove-tag-btn"><X size={10} /></button>
                </div>
                <button className="clear-all-filters">
                    <X size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }} />
                </button>
            </div>

            {/* Selected Info & Bulk Action */}
            <div className="mb-4">
                <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${selectedRows.length > 0 ? 'bg-emerald-dim border-emerald text-emerald' : 'bg-transparent border-gray-600 text-gray-400'
                        }`}
                    onClick={selectAllRecords}
                >
                    {selectedRows.length > 0 ? `Unselect All (${selectedRows.length})` : 'Select All Records'}
                </button>
            </div>

            {/* Grouped Table */}
            <div className="ha-table-container">
                {Object.keys(filteredData).length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No records found matching "{searchQuery}"</div>
                ) : (
                    Object.entries(filteredData).map(([groupName, rows]) => (
                        <div key={groupName} className="group-wrapper">
                            <div className="group-header" onClick={() => toggleGroup(groupName)}>
                                {expandedGroups[groupName] ? <Minus size={18} className="group-toggle-icon" /> : <Plus size={18} className="group-toggle-icon" />}
                                <div className="group-count-badge">{rows.length}</div>
                                <span className="group-title">{groupName}</span>
                            </div>

                            {expandedGroups[groupName] && (
                                <div className="ha-table-wrapper">
                                    <table className="ha-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '50px' }}></th>
                                                <th>Employee</th>
                                                <th>Month</th>
                                                <th>Year</th>
                                                <th>Worked Hours</th>
                                                <th>Pending Hours</th>
                                                <th>Overtime</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map(row => (
                                                <tr key={row.id}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.includes(row.id)}
                                                            onChange={() => toggleRow(row.id)}
                                                            className="checkbox-custom"
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="employee-cell-meta">
                                                            <div className="employee-avatar-sm">{row.avatar}</div>
                                                            <span className="emp-name">{row.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{row.month}</td>
                                                    <td>{row.year}</td>
                                                    <td>{row.worked}</td>
                                                    <td>{row.pending}</td>
                                                    <td className="text-emerald font-semibold">{row.overtime}</td>
                                                    <td>
                                                        <div className="action-btns">
                                                            <button className="ha-action-btn"><Edit3 size={16} /></button>
                                                            <button className="ha-action-btn delete"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>


            {/* Modal - Dedicated for Hour Account */}
            <HourAccountModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}
