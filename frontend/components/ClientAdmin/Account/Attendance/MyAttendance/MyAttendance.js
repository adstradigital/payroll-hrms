'use client';

import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import '../Attendance.css';

const mockPersonalHistory = [
    { date: '19 Jan 2026', day: 'Monday', in: '09:02', out: '18:05', status: 'Present', hours: '9.0' },
    { date: '18 Jan 2026', day: 'Sunday', in: '-', out: '-', status: 'Weekly Off', hours: '-' },
    { date: '17 Jan 2026', day: 'Saturday', in: '-', out: '-', status: 'Weekly Off', hours: '-' },
    { date: '16 Jan 2026', day: 'Friday', in: '08:58', out: '18:15', status: 'Present', hours: '9.3' },
    { date: '15 Jan 2026', day: 'Thursday', in: '09:45', out: '18:00', status: 'Late', hours: '8.2' },
];

export default function MyAttendance() {
    return (
        <div className="my-attendance">
            <div className="stats-grid stats-grid--4 mb-8">
                <div className="att-card">
                    <p className="summary-item__label uppercase font-bold mb-1">Today's In Time</p>
                    <p className="text-xl font-bold text-white">09:02 AM</p>
                </div>
                <div className="att-card">
                    <p className="summary-item__label uppercase font-bold mb-1">Weekly Hours</p>
                    <p className="text-xl font-bold text-white">45.5 Hrs</p>
                </div>
                <div className="att-card">
                    <p className="summary-item__label uppercase font-bold mb-1">Leaves Used</p>
                    <p className="text-xl font-bold text-white">2.0 Days</p>
                </div>
                <div className="att-card att-card--premium flex-center cursor-pointer hover:opacity-90 transition-opacity">
                    <div className="flex items-center gap-2 text-white font-bold">
                        <Clock size={20} /> Punch Out
                    </div>
                </div>
            </div>

            <div className="att-card overflow-hidden p-0">
                <div className="p-6 border-b border-white/5 flex-between">
                    <h3 className="text-lg font-semibold text-white">Personal Attendance History</h3>
                    <div className="flex gap-4">
                        <button className="text-xs text-slate-400 hover:text-white transition-colors uppercase font-bold">Dashboard</button>
                        <button className="text-xs text-slate-400 hover:text-white transition-colors uppercase font-bold">Monthly</button>
                    </div>
                </div>
                <div className="att-table-container border-0 rounded-none">
                    <table className="att-table">
                        <thead>
                            <tr className="bg-white/5">
                                <th>Date / Day</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Status</th>
                                <th>Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockPersonalHistory.map((row, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="font-medium text-white">{row.date}</div>
                                        <div className="text-[10px] text-slate-500 p-0.5 bg-white/5 rounded w-fit mt-1 uppercase font-bold">{row.day}</div>
                                    </td>
                                    <td className="text-emerald font-mono">{row.in}</td>
                                    <td className="text-rose font-mono">{row.out}</td>
                                    <td>
                                        <span className={`badge-round uppercase ${row.status === 'Present' ? 'bg-emerald-dim text-emerald' :
                                                row.status === 'Late' ? 'bg-amber-dim text-amber' :
                                                    'bg-white/10 text-slate-400'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="font-bold">{row.hours}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
