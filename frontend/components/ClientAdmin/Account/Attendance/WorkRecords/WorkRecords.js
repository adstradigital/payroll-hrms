'use client';

import { FileText, Download, Calendar, User } from 'lucide-react';
import '../Attendance.css';

const mockRecords = [
    { id: 1, employee: 'John Doe', date: '2026-01-19', checkIn: '09:05 AM', checkOut: '18:15 PM', breakTime: '45 mins', totalTime: '8h 25m', status: 'Completed' },
    { id: 2, employee: 'John Doe', date: '2026-01-18', checkIn: '08:55 AM', checkOut: '18:05 PM', breakTime: '60 mins', totalTime: '8h 10m', status: 'Completed' },
    { id: 3, employee: 'John Doe', date: '2026-01-17', checkIn: '09:15 AM', checkOut: '17:30 PM', breakTime: '30 mins', totalTime: '7h 45m', status: 'Incomplete' },
];

export default function WorkRecords() {
    return (
        <div className="work-records space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="space-y-1.5 flex-1">
                    <label className="text-xs text-slate-400 ml-1">Select Employee</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <select className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none">
                            <option>John Doe (EMP001)</option>
                            <option>Jane Smith (EMP002)</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1.5 flex-1">
                    <label className="text-xs text-slate-400 ml-1">Start Date</label>
                    <input type="date" className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-4 text-sm text-white outline-none" defaultValue="2026-01-01" />
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                    Filter Records
                </button>
            </div>

            <div className="att-table-container">
                <table className="att-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Break</th>
                            <th>Net Work Time</th>
                            <th>Status</th>
                            <th className="text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockRecords.map(record => (
                            <tr key={record.id}>
                                <td className="font-medium">{record.date}</td>
                                <td className="text-emerald">{record.checkIn}</td>
                                <td className="text-rose">{record.checkOut}</td>
                                <td className="p-4">{record.breakTime}</td>
                                <td className="font-semibold text-white">{record.totalTime}</td>
                                <td>
                                    <span className={`badge-round uppercase ${record.status === 'Completed' ? 'bg-emerald-dim text-emerald' : 'bg-amber-dim text-amber'}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <button className="text-slate-500 hover:text-indigo transition-colors">
                                        <FileText size={18} />
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
