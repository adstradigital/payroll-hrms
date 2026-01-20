import { useState } from 'react';
import { Filter, MoreVertical, Plus } from 'lucide-react';
import './MyAttendance.css';

const mockAttendanceData = [
    { id: 1, name: 'Adam Luis', empId: 'PEP00', date: '21/01/2026', day: 'Wednesday', checkIn: '08:30', inDate: '21/01/2026', checkOut: '12:49', outDate: '20/01/2026', shift: 'Regular Shift', workType: 'Work From Office', minHour: '08:15', atWork: '11:54', pending: '00:00', overtime: '01:30', status: 'validated' },
    { id: 2, name: 'Adam Luis', empId: 'PEP00', date: '20/01/2026', day: 'Tuesday', checkIn: '00:53', inDate: '20/01/2026', checkOut: 'None', outDate: 'None', shift: 'Regular Shift', workType: 'None', minHour: '08:15', atWork: '00:00', pending: '08:15', overtime: '00:00', status: 'validated' },
    { id: 3, name: 'Adam Luis', empId: 'PEP00', date: '19/01/2026', day: 'Monday', checkIn: '07:45', inDate: '19/01/2026', checkOut: 'None', outDate: 'None', shift: 'Regular Shift', workType: 'None', minHour: '00:00', atWork: '00:00', pending: '00:00', overtime: '00:00', status: 'validated' },
    { id: 4, name: 'Adam Luis', empId: 'PEP00', date: '18/01/2026', day: 'Sunday', checkIn: '14:26', inDate: '18/01/2026', checkOut: 'None', outDate: 'None', shift: 'Regular Shift', workType: 'None', minHour: '00:00', atWork: '00:00', pending: '00:00', overtime: '00:00', status: 'not-validated' },
    { id: 5, name: 'Adam Luis', empId: 'PEP00', date: '17/01/2026', day: 'Saturday', checkIn: '03:02', inDate: '17/01/2026', checkOut: 'None', outDate: 'None', shift: 'Regular Shift', workType: 'None', minHour: '08:15', atWork: '00:00', pending: '08:15', overtime: '00:00', status: 'validated' },
    { id: 6, name: 'Adam Luis', empId: 'PEP00', date: '16/01/2026', day: 'Friday', checkIn: '09:47', inDate: '16/01/2026', checkOut: '12:59', outDate: '16/01/2026', shift: 'Regular Shift', workType: 'None', minHour: '08:15', atWork: '03:12', pending: '05:03', overtime: '00:00', status: 'requested' },
    { id: 7, name: 'Adam Luis', empId: 'PEP00', date: '15/01/2026', day: 'Thursday', checkIn: '08:30', inDate: '15/01/2026', checkOut: 'None', outDate: 'None', shift: 'Regular Shift', workType: 'None', minHour: '00:00', atWork: '00:00', pending: '00:00', overtime: '00:00', status: 'approved' },
];

export default function MyAttendance() {
    return (
        <div className="my-attendance-section">
            <div className="ma-header">
                <h2 className="ma-title">My Attendances</h2>
                <div className="flex items-center gap-6">
                    <div className="ma-legend-bar">
                        <div className="ma-legend-item"><span className="ma-dot green"></span> Validated</div>
                        <div className="ma-legend-item"><span className="ma-dot red"></span> Not validated</div>
                        <div className="ma-legend-item"><span className="ma-dot yellow"></span> Requested</div>
                        <div className="ma-legend-item"><span className="ma-dot blue"></span> Approved request</div>
                    </div>
                    <button className="ma-filter-btn">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            <div className="ma-table-container">
                <table className="ma-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Work Type</th>
                            <th>Min Hour</th>
                            <th>At Work</th>
                            <th>Pending Hour</th>
                            <th>Overtime</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockAttendanceData.map(row => (
                            <tr key={row.id} className={`status-${row.status}`}>
                                <td>
                                    <div className="ma-emp-cell">
                                        <div className="ma-avatar">AL</div>
                                        <div className="ma-emp-details">
                                            <span className="ma-emp-name">{row.name}</span>
                                            <span className="ma-emp-id">({row.empId})</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{row.date}</td>
                                <td><span className="ma-shift-badge">{row.shift}</span></td>
                                <td className="text-sm text-slate-400">{row.workType}</td>
                                <td className="ma-time">{row.minHour}</td>
                                <td className="ma-time text-emerald">{row.atWork}</td>
                                <td className="ma-pending">{row.pending}</td>
                                <td className="ma-overtime">{row.overtime}</td>
                                <td>
                                    <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


        </div>
    );
}
