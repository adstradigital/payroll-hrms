'use client';

import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';

const mockPersonalHistory = [
    { date: '19 Jan 2026', day: 'Monday', in: '09:02', out: '18:05', status: 'Present', hours: '9.0' },
    { date: '18 Jan 2026', day: 'Sunday', in: '-', out: '-', status: 'Weekly Off', hours: '-' },
    { date: '17 Jan 2026', day: 'Saturday', in: '-', out: '-', status: 'Weekly Off', hours: '-' },
    { date: '16 Jan 2026', day: 'Friday', in: '08:58', out: '18:15', status: 'Present', hours: '9.3' },
    { date: '15 Jan 2026', day: 'Thursday', in: '09:45', out: '18:00', status: 'Late', hours: '8.2' },
];

export default function MyAttendance() {
    return (
        <div className="my-attendance space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Today's In Time</p>
                    <p className="text-xl font-bold text-white">09:02 AM</p>
                </div>
                <div className="card p-4 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Weekly Hours</p>
                    <p className="text-xl font-bold text-white">45.5 Hrs</p>
                </div>
                <div className="card p-4 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Leaves Used</p>
                    <p className="text-xl font-bold text-white">2.0 Days</p>
                </div>
                <div className="card p-4 bg-indigo-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors">
                    <div className="flex items-center gap-2 text-white font-bold">
                        <Clock size={20} /> Punch Out
                    </div>
                </div>
            </div>

            <div className="card border border-white/5 bg-white/5 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Personal Attendance History</h3>
                    <div className="flex gap-2">
                        <button className="text-xs text-slate-400 hover:text-white transition-colors">DASHBOARD</button>
                        <button className="text-xs text-slate-400 hover:text-white transition-colors">MONTHLY</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-xs font-bold uppercase p-4 bg-white/5">
                                <th className="p-4">Date / Day</th>
                                <th className="p-4">Check In</th>
                                <th className="p-4">Check Out</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Total Hours</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {mockPersonalHistory.map((row, idx) => (
                                <tr key={idx} className="border-b border-white/5 last:border-0 group hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{row.date}</div>
                                        <div className="text-[10px] text-slate-500 p-0.5 bg-white/5 rounded w-fit mt-1">{row.day.toUpperCase()}</div>
                                    </td>
                                    <td className="p-4 text-emerald-500 font-mono">{row.in}</td>
                                    <td className="p-4 text-rose-500 font-mono">{row.out}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' :
                                                row.status === 'Late' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-slate-500/10 text-slate-500'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold">{row.hours}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
