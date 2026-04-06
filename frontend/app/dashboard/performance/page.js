'use client';

import { useState } from 'react';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import PerformanceDashboard from '@/components/ClientAdmin/HRMS/Performance/Dashboard/Dashboard';
import Ratings from '@/components/ClientAdmin/HRMS/Performance/Ratings/Ratings';
import PerformanceReviews from '@/components/ClientAdmin/HRMS/Performance/Reviews/PerformanceReviews';
import ModuleGuard from '@/components/ClientAdmin/ModuleGuard';
import { LayoutGrid, Binary, Target } from 'lucide-react';

export default function PerformancePage() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutGrid },
        { id: 'framework', label: 'Evaluation Framework', icon: Binary },
        { id: 'reviews', label: 'Active Reviews', icon: Target },
    ];

    return (
        <Dashboard
            title="Performance Management"
            subtitle="Track and manage employee performance reviews and goals"
            breadcrumbs={['Dashboard', 'Performance']}
        >
            <ModuleGuard module="HRMS">
                <div className="performance-container">
                    {/* Sub-Navigation Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 mb-8 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
                                        isActive 
                                            ? 'border-indigo-500 text-indigo-600 bg-indigo-50/10' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <Icon size={12} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content transition-all duration-300">
                        {activeTab === 'dashboard' && <PerformanceDashboard />}
                        {activeTab === 'framework' && <Ratings />}
                        {activeTab === 'reviews' && <PerformanceReviews />}
                    </div>
                </div>
            </ModuleGuard>
        </Dashboard>
    );
}
