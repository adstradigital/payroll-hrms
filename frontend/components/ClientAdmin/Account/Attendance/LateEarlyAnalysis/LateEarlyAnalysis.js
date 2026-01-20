'use client';

import { AlertTriangle, Clock, TrendingDown, Users } from 'lucide-react';
import '../Attendance.css';

const mockLateComers = [
    { id: 1, name: 'John Doe', date: '2026-01-19', status: 'Late', delay: '15 mins', policy: 'Standard Morning' },
    { id: 2, name: 'Jane Smith', date: '2026-01-19', status: 'Late', delay: '45 mins', policy: 'Standard Morning' },
    { id: 3, name: 'Sarah Wilson', date: '2026-01-18', status: 'Early Out', delay: '30 mins', policy: 'Standard Evening' },
];

export default function LateEarlyAnalysis() {
    return (
        <div className="late-early-analysis">
            <div className="stats-grid stats-grid--2 mb-8">
                <div className="att-card bg-rose-dim">
                    <div className="flex-between mb-4">
                        <div className="p-2 bg-rose-dim text-rose rounded-lg">
                            <Clock size={24} />
                        </div>
                        <span className="badge-round text-rose bg-rose-dim">THIS WEEK</span>
                    </div>
                    <div className="summary-item">
                        <p className="summary-item__label">Average Late Arrival</p>
                        <h2 className="summary-item__value">12.5 <span className="text-lg font-normal">mins</span></h2>
                    </div>
                </div>

                <div className="att-card bg-amber-dim">
                    <div className="flex-between mb-4">
                        <div className="p-2 bg-amber-dim text-amber rounded-lg">
                            <Users size={24} />
                        </div>
                        <span className="badge-round text-amber bg-amber-dim">TODAY</span>
                    </div>
                    <div className="summary-item">
                        <p className="summary-item__label">Frequent Late Comers</p>
                        <h2 className="summary-item__value">8 <span className="text-lg font-normal">Employees</span></h2>
                    </div>
                </div>
            </div>

            <div className="att-card">
                <h3 className="text-lg font-semibold text-white mb-6">Late / Early Out Exceptions</h3>
                <div className="att-table-container">
                    <table className="att-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Exception Type</th>
                                <th>Deviation</th>
                                <th>Policy Applied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockLateComers.map(row => (
                                <tr key={row.id}>
                                    <td className="text-white font-medium">{row.name}</td>
                                    <td>{row.date}</td>
                                    <td>
                                        <span className={`badge-round uppercase ${row.status === 'Late' ? 'bg-amber-dim text-amber' : 'bg-rose-dim text-rose'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="font-mono">{row.delay}</td>
                                    <td className="text-slate-500 italic">{row.policy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
