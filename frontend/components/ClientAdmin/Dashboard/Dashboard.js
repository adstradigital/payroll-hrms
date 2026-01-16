'use client';

import Sidebar from '@/components/ClientAdmin/Dashboard/Sidebar/Sidebar';
import Header from '@/components/ClientAdmin/Dashboard/Header/Header';
import './Dashboard.css';

export default function Dashboard({ children, title, subtitle, breadcrumbs }) {
    return (
        <div className="dashboard">
            <Sidebar />

            <div className="dashboard__main">
                <Header breadcrumbs={breadcrumbs} />

                <main className="dashboard__content">
                    {/* Page Header */}
                    {title && (
                        <div className="dashboard__page-header">
                            <div className="dashboard__page-info">
                                <h1 className="dashboard__page-title">{title}</h1>
                                {subtitle && (
                                    <p className="dashboard__page-subtitle">{subtitle}</p>
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
        </div>
    );
}
