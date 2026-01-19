'use client';

import { useState } from 'react';
import { Tablet, Activity, Signal, AlertTriangle } from 'lucide-react';

const mockDevices = [
    { id: 1, name: 'Main Entrance - G1', location: 'Ground Floor Main Gate', status: 'online', lastSync: '2 minutes ago', ip: '192.168.1.101' },
    { id: 2, name: 'Service Entry - G2', location: 'Basement Service Door', status: 'online', lastSync: '5 minutes ago', ip: '192.168.1.102' },
    { id: 3, name: 'Staff Lounge - F2', location: 'Second Floor Reception', status: 'offline', lastSync: '2 hours ago', ip: '192.168.1.103' },
    { id: 4, name: 'Executive Wing - F4', location: 'Fourth Floor VIP', status: 'online', lastSync: '1 minute ago', ip: '192.168.1.104' },
];

export default function BiometricDevices() {
    return (
        <div className="biometric-devices">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {mockDevices.map(device => (
                    <div key={device.id} className="card p-4 border border-white/5 bg-white/5 rounded-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                <Tablet size={20} />
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${device.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {device.status.toUpperCase()}
                            </span>
                        </div>
                        <h4 className="font-semibold text-white mb-1">{device.name}</h4>
                        <p className="text-xs text-slate-400 mb-4">{device.location}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-white/5">
                            <span className="flex items-center gap-1">
                                <Activity size={12} /> {device.ip}
                            </span>
                            <span>{device.lastSync}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card p-6 border border-white/5 bg-white/5 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Device Logs (Recent Records)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-sm border-b border-white/5">
                                <th className="pb-3 pr-4">Timestamp</th>
                                <th className="pb-3 pr-4">Device</th>
                                <th className="pb-3 pr-4">Event Type</th>
                                <th className="pb-3 pr-4">Employee ID</th>
                                <th className="pb-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {[1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="border-b border-white/5 last:border-0">
                                    <td className="py-4 pr-4 whitespace-nowrap">2026-01-19 15:45:0{i}</td>
                                    <td className="py-4 pr-4">Main Entrance - G1</td>
                                    <td className="py-4 pr-4">
                                        <span className="flex items-center gap-2">
                                            <Signal size={14} className="text-emerald-500" /> Fingerprint Match
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4">EMP00{i}</td>
                                    <td className="py-4 font-mono text-xs text-slate-500">GATE_OPENED_SUCCESS</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
