'use client';

import { Activity, Bell, MapPin, Smartphone } from 'lucide-react';
import '../Attendance.css';

const mockActivities = [
    { id: 1, type: 'Punch In', employee: 'Mishal', time: '09:02 AM', location: 'GPS - Office Perimeter', device: 'iPhone 15 Pro' },
    { id: 2, type: 'Face ID Success', employee: 'John Doe', time: '09:05 AM', location: 'Main Entrance G1', device: 'HikVision Terminal' },
    { id: 3, type: 'Exit Request', employee: 'Sarah Wilson', time: '01:15 PM', location: 'Side Exit', device: 'Manual Override' },
    { id: 4, type: 'Punch Out', employee: 'Jane Smith', time: '05:30 PM', location: 'Remote - Home', device: 'WebApp' },
];

export default function AttendanceActivities() {
    return (
        <div className="attendance-activities">
            <div className="att-card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-dim text-amber rounded-lg">
                        <Activity size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Live Activity Stream</h3>
                </div>

                <div className="activity-list" style={{ position: 'relative' }}>
                    {mockActivities.map(activity => (
                        <div key={activity.id} className="activity-item">
                            <div className="activity-avatar">
                                {activity.employee.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                    {activity.employee} performed <span className="text-indigo">{activity.type}</span>
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
                    ))}
                </div>
            </div>
        </div>
    );
}
