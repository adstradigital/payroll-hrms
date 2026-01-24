'use client';

import { useState } from 'react';
import { Search, Filter, LayoutGrid, Trash2, Plus, GripVertical, ChevronDown } from 'lucide-react';
import './AttendanceActivities.css';

const mockActivityData = [
    { id: 1, name: 'Kiran Kishor', empId: 'PEP00', date: '20/01/2026', inDate: '20/01/2026', checkIn: '12:49', checkOut: 'None', outDate: 'None' },
    { id: 2, name: 'Afsal', empId: 'PEP01', date: '20/01/2026', inDate: '20/01/2026', checkIn: '12:49', checkOut: '12:49', outDate: '20/01/2026' },
    { id: 3, name: 'Sunsreekumar', empId: 'PEP02', date: '20/01/2026', inDate: '20/01/2026', checkIn: '12:41', checkOut: '12:49', outDate: '20/01/2026' },
    { id: 4, name: 'Jagathu', empId: 'PEP03', date: '20/01/2026', inDate: '20/01/2026', checkIn: '12:41', checkOut: '12:41', outDate: '20/01/2026' },
    { id: 5, name: 'Ankit Pokhrel', empId: 'PEP04', date: '20/01/2026', inDate: '20/01/2026', checkIn: '12:40', checkOut: '12:41', outDate: '20/01/2026' },
    { id: 6, name: 'Ravi Kumar', empId: 'PEP05', date: '20/01/2026', inDate: '20/01/2026', checkIn: '12:40', checkOut: '12:40', outDate: '20/01/2026' },
    { id: 7, name: 'Priya Sharma', empId: 'PEP06', date: '20/01/2026', inDate: '20/01/2026', checkIn: '09:13', checkOut: '12:40', outDate: '20/01/2026' },
    { id: 8, name: 'Rahul Verma', empId: 'PEP07', date: '20/01/2026', inDate: '20/01/2026', checkIn: '09:11', checkOut: '09:11', outDate: '20/01/2026' },
];

export default function AttendanceActivities() {
    const [selectedItems, setSelectedItems] = useState([]);

    const toggleSelectAll = () => {
        if (selectedItems.length === mockActivityData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(mockActivityData.map(item => item.id));
        }
    };

    const toggleItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    return (
        <div className="attendance-activities-section">
            <div className="aa-header">
                <h2 className="aa-title">Attendance Activity</h2>
                <div className="aa-toolbar">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search" className="aa-search-input" />
                    </div>
                    <button className="aa-tool-btn"><Filter size={16} /> Filter</button>
                    <button className="aa-tool-btn"><LayoutGrid size={16} /> Group By</button>
                    <button className="aa-tool-btn">Actions <ChevronDown size={14} /></button>
                </div>
            </div>

            <div className="aa-selection-bar">
                <button className="select-all-btn" onClick={toggleSelectAll}>
                    Select All Attendance
                </button>
            </div>

            <div className="aa-table-container">
                <table className="aa-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    className="checkbox-custom"
                                    checked={selectedItems.length === mockActivityData.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th><div className="flex items-center gap-2"><GripVertical size={14} /> Employee</div></th>
                            <th><div className="flex items-center gap-2"><GripVertical size={14} /> Attendance Date</div></th>
                            <th><div className="flex items-center gap-2"><GripVertical size={14} /> In Date</div></th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th><div className="flex items-center gap-2"><GripVertical size={14} /> Out Date</div></th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockActivityData.map(row => (
                            <tr key={row.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        className="checkbox-custom"
                                        checked={selectedItems.includes(row.id)}
                                        onChange={() => toggleItem(row.id)}
                                    />
                                </td>
                                <td>
                                    <div className="aa-emp-cell">
                                        <div className="aa-avatar">{row.name.charAt(0)}</div>
                                        <div className="aa-emp-details">
                                            <span className="aa-emp-name">{row.name}</span>
                                            <span className="aa-emp-id">({row.empId})</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{row.date}</td>
                                <td>{row.inDate}</td>
                                <td>{row.checkIn}</td>
                                <td>{row.checkOut}</td>
                                <td>{row.outDate}</td>
                                <td>
                                    <button className="aa-delete-btn"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button className="aa-fab">
                <Plus size={28} />
            </button>
        </div>
    );
}
