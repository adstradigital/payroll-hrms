'use client';

import Sidebar from '@/components/ClientAdmin/Dashboard/Sidebar/Sidebar';
import Header from '@/components/ClientAdmin/Dashboard/Header/Header';
import FloatingQuickActions from '@/components/ClientAdmin/Dashboard/Widgets/FloatingQuickActions';
import ClockAttendanceWidget from '@/components/ClientAdmin/Dashboard/Widgets/ClockAttendanceWidget';
import { useAuth } from '@/context/AuthContext';
import './Dashboard.css';

// Get dynamic greeting based on time of day
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
};

export default function Dashboard({ children, title, subtitle, breadcrumbs, showGreeting = false }) {
    const { user } = useAuth();

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="dashboard__main">
                <Header breadcrumbs={breadcrumbs} />

                <main className="dashboard__content">
                    {/* Welcome Greeting */}
                    {showGreeting && (
                        <div className="dashboard__greeting animate-fade-in">
                            <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}! 👋</h2>
                            <p>Here's what's happening in your organization today.</p>
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
