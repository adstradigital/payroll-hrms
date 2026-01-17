'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import {
    StatCard, AttendanceChart, MiniCalendar,
    HolidayBanner, RecentActivityTable,
    ActionsWidget, MyTeamWidget, NextRunWidget
} from '@/components/ClientAdmin/Dashboard/Widgets/Widgets';
import {
    Users, Clock, Calendar, Wallet,
    Download, MoreVertical
} from 'lucide-react';

export default function DashboardPage() {
    const stats = [
        { title: 'Total Employees', value: '1,248', trend: 'up', trendValue: '12%', icon: Users, color: 'primary' },
        { title: 'On Time Today', value: '95%', trend: 'up', trendValue: '4.2%', icon: Clock, color: 'success' },
        { title: 'On Leave', value: '34', trend: 'down', trendValue: '2%', icon: Calendar, color: 'warning' },
        { title: 'Total Payroll', value: '₹14.2L', trend: 'up', trendValue: '8.1%', icon: Wallet, color: 'info' },
    ];

    return (
        <Dashboard breadcrumbs={['Home', 'Dashboard']}>
            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Middle Section: Charts */}
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card__header">
                        <div>
                            <h3 className="card__title">Attendance Overview</h3>
                            <p className="card__subtitle">Weekly check-in trends</p>
                        </div>
                        <button className="action-btn"><MoreVertical size={16} /></button>
                    </div>
                    <AttendanceChart />
                </div>

                <div className="card">
                    <div className="card__header">
                        <div>
                            <h3 className="card__title">Payroll Trends</h3>
                            <p className="card__subtitle">Monthly salary expenses</p>
                        </div>
                        <button className="action-btn"><Download size={16} /></button>
                    </div>
                    {/* SVG Based Payroll Chart */}
                    <div className="chart-container">
                        <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0,35 Q15,10 30,25 T60,15 T90,5 L100,5 L100,40 L0,40 Z"
                                fill="url(#grad)"
                            />
                            <path
                                d="M0,35 Q15,10 30,25 T60,15 T90,5"
                                fill="none"
                                stroke="var(--brand-primary)"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <circle cx="30" cy="25" r="2" fill="var(--bg-secondary)" stroke="var(--brand-primary)" strokeWidth="1.5" />
                            <circle cx="60" cy="15" r="2" fill="var(--bg-secondary)" stroke="var(--brand-primary)" strokeWidth="1.5" />
                            <circle cx="90" cy="5" r="2" fill="var(--bg-secondary)" stroke="var(--brand-primary)" strokeWidth="1.5" />
                        </svg>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                            <span className="bar-label">Aug</span>
                            <span className="bar-label">Sep</span>
                            <span className="bar-label">Oct</span>
                            <span className="bar-label">Nov</span>
                            <span className="bar-label">Dec</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Widgets Row */}
            <div className="action-widgets-grid">
                <ActionsWidget />
                <MyTeamWidget />
                <NextRunWidget />
            </div>

            {/* Bottom Section: Recent Activity & Calendar Widget */}
            <div className="dashboard-grid" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="card">
                    <div className="card__header">
                        <div>
                            <h3 className="card__title">Recent Activity</h3>
                            <p className="card__subtitle">Latest employee status updates</p>
                        </div>
                        <button className="text-link" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--brand-primary)' }}>View All</button>
                    </div>
                    <RecentActivityTable />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div className="card">
                        <h3 className="card__title" style={{ marginBottom: 'var(--spacing-md)' }}>Calendar</h3>
                        <MiniCalendar />
                    </div>
                    <HolidayBanner />
                </div>
            </div>
        </Dashboard>
    );
}
