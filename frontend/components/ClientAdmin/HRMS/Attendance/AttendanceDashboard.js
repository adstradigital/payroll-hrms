'use client';

import { Users, Clock, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function AttendanceDashboard() {
    const stats = [
        { label: 'Present Today', value: '1,142', total: '1,248', color: 'emerald', icon: Users },
        { label: 'On Time', value: '95%', total: 'Trend: +2.1%', color: 'indigo', icon: Clock },
        { label: 'On Leave', value: '34', total: 'Scheduled: 42', color: 'amber', icon: Calendar },
        { label: 'Late Arrivals', value: '12', total: 'Trend: -5%', color: 'rose', icon: AlertCircle },
    ];

    return (
        <div className="attendance-dashboard space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="card p-6 border border-white/5 bg-white/5 rounded-2xl hover:bg-white/[0.07] transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                                    <ArrowUpRight size={14} /> 12%
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                                <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
                                <p className="text-xs text-slate-400 pt-1">{stat.total}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions & Charts Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card p-8 border border-white/5 bg-white/5 rounded-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white">Attendance Trends</h3>
                            <p className="text-slate-500 text-sm">Weekly check-in patterns across departments</p>
                        </div>
                        <select className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    {/* Placeholder for a chart */}
                    <div className="h-[250px] flex items-end justify-between gap-4 px-4">
                        {[45, 82, 63, 91, 58, 74, 88].map((h, i) => (
                            <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg relative group transition-all hover:bg-indigo-500/40" style={{ height: `${h}%` }}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider px-4">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                <div className="card p-8 border border-white/5 bg-white/5 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Activities</h3>
                    <div className="space-y-6">
                        {[
                            { name: 'Mishal', action: 'Punch In', time: '09:02 AM', status: 'On-Time' },
                            { name: 'John Doe', action: 'Punch In', time: '09:05 AM', status: 'On-Time' },
                            { name: 'Sarah Wilson', action: 'Punch In', time: '09:45 AM', status: 'Late' },
                            { name: 'Jane Smith', action: 'Break Start', time: '01:15 PM', status: 'N/A' },
                        ].map((act, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-bold text-indigo-400">
                                    {act.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">{act.name}</p>
                                    <p className="text-xs text-slate-500">{act.action} • {act.time}</p>
                                </div>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${act.status === 'Late' ? 'bg-rose-500' : act.status === 'On-Time' ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                    {act.status}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all">
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
}
