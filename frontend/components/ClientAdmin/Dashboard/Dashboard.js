'use client';

import Sidebar from '@/components/ClientAdmin/Dashboard/Sidebar/Sidebar';
import Header from '@/components/ClientAdmin/Dashboard/Header/Header';
import FloatingQuickActions from '@/components/ClientAdmin/Dashboard/Widgets/FloatingQuickActions';
import ClockAttendanceWidget from '@/components/ClientAdmin/Dashboard/Widgets/ClockAttendanceWidget';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import './Dashboard.css';

// Get dynamic greeting based on time of day

export default function Dashboard({ children, title, subtitle, breadcrumbs, showGreeting = false }) {
    const { user } = useAuth();
    const { t } = useLanguage();

    // Get dynamic greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('common.goodMorning');
        if (hour >= 12 && hour < 17) return t('common.goodAfternoon');
        if (hour >= 17 && hour < 21) return t('common.goodEvening');
        return t('common.goodNight');
    };

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
                            <p>{t('common.dashboardSubtitle')}</p>
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
