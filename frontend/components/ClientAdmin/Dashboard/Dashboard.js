'use client';

import Sidebar from '@/components/ClientAdmin/Dashboard/Sidebar/Sidebar';
import Header from '@/components/ClientAdmin/Dashboard/Header/Header';
import FloatingQuickActions from '@/components/ClientAdmin/Dashboard/Widgets/FloatingQuickActions';
import ClockAttendanceWidget from '@/components/ClientAdmin/Dashboard/Widgets/ClockAttendanceWidget';
import { useAuth } from '@/context/AuthContext';
import './Dashboard.css';

export default function Dashboard({ children, title, subtitle, breadcrumbs, hideGreeting = false }) {
    const { user } = useAuth();

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="dashboard__main">
                <Header breadcrumbs={breadcrumbs} />

                <main className="dashboard__content">
                    {/* Welcome Greeting */}
                    {!hideGreeting && (
                        <div className="dashboard__greeting animate-fade-in">
                            <h2>Good Morning, {user?.name?.split(' ')[0] || 'Admin'}! 👋</h2>
                            <p>Here's what's happening in your organization today.</p>
                        </div>
                    )}

                    {/* Page Header (Optional) */}
                    {title && (
                        <div className="card__header" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div>
                                <h1 className="card__title">{title}</h1>
                                {subtitle && (
                                    <p className="card__subtitle">{subtitle}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="dashboard__page-content">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global Draggable Quick Actions */}
            <ClockAttendanceWidget />
            <FloatingQuickActions />
        </div>
    );
}
