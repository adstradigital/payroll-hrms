'use client';

import { AlertTriangle, Clock, TrendingDown, Users } from 'lucide-react';

const mockLateComers = [
    { id: 1, name: 'John Doe', date: '2026-01-19', status: 'Late', delay: '15 mins', policy: 'Standard Morning' },
    { id: 2, name: 'Jane Smith', date: '2026-01-19', status: 'Late', delay: '45 mins', policy: 'Standard Morning' },
    { id: 3, name: 'Sarah Wilson', date: '2026-01-18', status: 'Early Out', delay: '30 mins', policy: 'Standard Evening' },
];

export default function LateEarlyAnalysis() {
    return (
        <div className="late-early-analysis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-rose-500/20 text-rose-500 rounded-lg">
                            <Clock size={24} />
                        </div>
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">THIS WEEK</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-sm">Average Late Arrival</p>
                        <h2 className="text-3xl font-bold text-white">12.5 <span className="text-lg font-normal">mins</span></h2>
                    </div>
                    <p className="text-xs text-rose-400/60 mt-4 flex items-center gap-1">
                        <TrendingDown size={12} /> -5% compared to last week
                    </p>
                </div>

                <div className="card p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">TODAY</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-sm">Frequent Late Comers</p>
                        <h2 className="text-3xl font-bold text-white">8 <span className="text-lg font-normal">Employees</span></h2>
                    </div>
                    <p className="text-xs text-amber-400/60 mt-4 flex items-center gap-1">
                        <AlertTriangle size={12} /> Requires review for 3 employees
                    </p>
                </div>
            </div>

            <div className="card p-6 border border-white/5 bg-white/5 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-6">Late / Early Out Exceptions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-sm border-b border-white/5">
                                <th className="pb-3 pr-4">Employee</th>
                                <th className="pb-3 pr-4">Date</th>
                                <th className="pb-3 pr-4">Exception Type</th>
                                <th className="pb-3 pr-4">Deviation</th>
                                <th className="pb-3">Policy Applied</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {mockLateComers.map(row => (
                                <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="py-4 pr-4 text-white font-medium">{row.name}</td>
                                    <td className="py-4 pr-4">{row.date}</td>
                                    <td className="py-4 pr-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${row.status === 'Late' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4 font-mono">{row.delay}</td>
                                    <td className="py-4 text-slate-500 italic">{row.policy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
