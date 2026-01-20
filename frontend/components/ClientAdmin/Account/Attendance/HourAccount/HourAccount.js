'use client';

import { BarChart2, TrendingUp, Clock, Calendar } from 'lucide-react';
import '../Attendance.css';

const mockHours = [
    { id: 1, employee: 'John Doe', regularHours: 160, overtime: 12, total: 172, balance: '+8', month: 'January 2026' },
    { id: 2, employee: 'Jane Smith', regularHours: 155, overtime: 0, total: 155, balance: '-5', month: 'January 2026' },
    { id: 3, employee: 'Sarah Wilson', regularHours: 160, overtime: 20, total: 180, balance: '+16', month: 'January 2026' },
];

export default function HourAccount() {
    return (
        <div className="hour-account">
            <div className="stats-grid stats-grid--3 mb-8">
                <div className="att-card bg-indigo-dim">
                    <p className="text-indigo text-sm mb-1 uppercase tracking-wider font-semibold">Total Work Hours</p>
                    <div className="flex-between">
                        <h2 className="text-3xl font-bold text-white">24,580</h2>
                        <div className="p-2 bg-indigo-dim rounded-lg text-indigo">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="att-card">
                <div className="flex-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Monthly Hours Summary</h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300">Previous Month</button>
                        <button className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg">January 2026</button>
                    </div>
                </div>
                <div className="att-table-container">
                    <table className="att-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Regular Hours</th>
                                <th>Overtime</th>
                                <th>Total Hours</th>
                                <th className="text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockHours.map(row => (
                                <tr key={row.id}>
                                    <td className="text-white font-medium">{row.employee}</td>
                                    <td>{row.regularHours}h</td>
                                    <td className="text-amber">{row.overtime}h</td>
                                    <td>{row.total}h</td>
                                    <td className={`text-right font-medium ${row.balance.startsWith('+') ? 'text-emerald' : 'text-rose'}`}>
                                        {row.balance}h
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
