'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const mockRequests = [
    { id: 1, employee: 'John Doe', type: 'Late In', date: '2026-01-19', reason: 'Personal emergency', status: 'pending', time: '09:45 AM' },
    { id: 2, employee: 'Jane Smith', type: 'Early Out', date: '2026-01-18', reason: 'Doctor appointment', status: 'approved', time: '04:00 PM' },
    { id: 3, employee: 'Mike Ross', type: 'Missing Punch', date: '2026-01-17', reason: 'Forgot to tag out', status: 'rejected', time: 'N/A' },
];

export default function AttendanceRequests() {
    return (
        <div className="attendance-requests">
            <div className="overflow-x-auto bg-white/5 border border-white/5 rounded-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-slate-500 text-sm border-b border-white/5">
                            <th className="p-4">Employee</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Requested Date</th>
                            <th className="p-4">Reason</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-300">
                        {mockRequests.map(req => (
                            <tr key={req.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium text-white">{req.employee}</td>
                                <td className="p-4">{req.type}</td>
                                <td className="p-4">{req.date} <span className="text-xs text-slate-500 ml-2">{req.time}</span></td>
                                <td className="p-4 max-w-xs truncate">{req.reason}</td>
                                <td className="p-4">
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs w-fit ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                            req.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
                                                'bg-amber-500/10 text-amber-500'
                                        }`}>
                                        {req.status === 'approved' ? <CheckCircle size={12} /> :
                                            req.status === 'rejected' ? <XCircle size={12} /> :
                                                <Clock size={12} />}
                                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-1 px-3 rounded hover:bg-emerald-500/20 text-emerald-500 transition-colors">Approve</button>
                                        <button className="p-1 px-3 rounded hover:bg-rose-500/20 text-rose-500 transition-colors">Reject</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
