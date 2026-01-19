'use client';

import { FileText, Download, Calendar, User } from 'lucide-react';

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
                    <input type="date" className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500" defaultValue="2026-01-01" />
                </div>
                <div className="space-y-1.5 flex-1">
                    <label className="text-xs text-slate-400 ml-1">End Date</label>
                    <input type="date" className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-4 text-sm text-white focus:outline-none focus:border-indigo-500" defaultValue="2026-01-31" />
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                    Filter Records
                </button>
            </div>

            <div className="card border border-white/5 bg-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <th className="p-4">Date</th>
                            <th className="p-4">Check In</th>
                            <th className="p-4">Check Out</th>
                            <th className="p-4">Break Duration</th>
                            <th className="p-4">Net Work Time</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-300">
                        {mockRecords.map(record => (
                            <tr key={record.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium">{record.date}</td>
                                <td className="p-4 text-emerald-400">{record.checkIn}</td>
                                <td className="p-4 text-rose-400">{record.checkOut}</td>
                                <td className="p-4">{record.breakTime}</td>
                                <td className="p-4 font-semibold text-white">{record.totalTime}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${record.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-slate-500 hover:text-indigo-400 transition-colors">
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
