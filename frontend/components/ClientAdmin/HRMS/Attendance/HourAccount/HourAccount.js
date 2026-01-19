'use client';

import { BarChart2, TrendingUp, Clock, Calendar } from 'lucide-react';

const mockHours = [
    { id: 1, employee: 'John Doe', regularHours: 160, overtime: 12, total: 172, balance: '+8', month: 'January 2026' },
    { id: 2, employee: 'Jane Smith', regularHours: 155, overtime: 0, total: 155, balance: '-5', month: 'January 2026' },
    { id: 3, employee: 'Sarah Wilson', regularHours: 160, overtime: 20, total: 180, balance: '+16', month: 'January 2026' },
];

export default function HourAccount() {
    return (
        <div className="hour-account">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="text-indigo-400 text-sm mb-1 uppercase tracking-wider font-semibold">Total Work Hours</p>
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-white">24,580</h2>
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Clock size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-indigo-400/60 mt-2 flex items-center gap-1">
                        <TrendingUp size={12} /> +12% from last month
                    </p>
                </div>
                {/* Add more stats card here if needed */}
            </div>

            <div className="card p-6 border border-white/5 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Monthly Hours Summary</h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300">Previous Month</button>
                        <button className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg">January 2026</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-sm border-b border-white/5">
                                <th className="pb-3 pr-4">Employee</th>
                                <th className="pb-3 pr-4">Regular Hours</th>
                                <th className="pb-3 pr-4">Overtime</th>
                                <th className="pb-3 pr-4">Total Hours</th>
                                <th className="pb-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {mockHours.map(row => (
                                <tr key={row.id} className="border-b border-white/5 last:border-0">
                                    <td className="py-4 pr-4 text-white font-medium">{row.employee}</td>
                                    <td className="py-4 pr-4">{row.regularHours}h</td>
                                    <td className="py-4 pr-4 text-amber-500">+{row.overtime}h</td>
                                    <td className="py-4 pr-4">{row.total}h</td>
                                    <td className={`py-4 text-right font-medium ${row.balance.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
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
