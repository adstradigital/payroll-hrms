'use client';

import { Activity, Bell, MapPin, Smartphone } from 'lucide-react';

const mockActivities = [
    { id: 1, type: 'Punch In', employee: 'Mishal', time: '09:02 AM', location: 'GPS - Office Perimeter', device: 'iPhone 15 Pro' },
    { id: 2, type: 'Face ID Success', employee: 'John Doe', time: '09:05 AM', location: 'Main Entrance G1', device: 'HikVision Terminal' },
    { id: 3, type: 'Exit Request', employee: 'Sarah Wilson', time: '01:15 PM', location: 'Side Exit', device: 'Manual Override' },
    { id: 4, type: 'Punch Out', employee: 'Jane Smith', time: '05:30 PM', location: 'Remote - Home', device: 'WebApp' },
];

export default function AttendanceActivities() {
    return (
        <div className="attendance-activities">
            <div className="card p-6 border border-white/5 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                        <Activity size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Live Activity Stream</h3>
                </div>

                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                    {mockActivities.map(activity => (
                        <div key={activity.id} className="relative pl-12">
                            <div className="absolute left-0 top-1 w-10 h-10 bg-slate-800 rounded-full border border-white/5 flex items-center justify-center z-10">
                                <span className="text-[10px] font-bold text-slate-400">
                                    {activity.employee.charAt(0)}
                                </span>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        {activity.employee} performed <span className="text-indigo-400">{activity.type}</span>
                                    </p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} /> {activity.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Smartphone size={12} /> {activity.device}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">
                                    {activity.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
