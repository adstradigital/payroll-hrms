import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SuperSidebar from './Sidebar/SuperSidebar';
import SuperHeader from './Header/SuperHeader';
import Organizations from './ClientAccountManagement/Organizations/Organizations';
import LoginManagement from './ClientAccountManagement/LoginManagement/LoginManagement';
import Approvals from './ClientAccountManagement/Approvals/Approvals';
import CreateUser from './ClientAccountManagement/CreateUser/CreateUser';
import CreateOrganization from './ClientAccountManagement/CreateOrganization/CreateOrganization';
import Overview from './Overview/Overview';
import SuperQuickActions from './QuickActions/SuperQuickActions';
import './SuperDashboard.css';

const SuperDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/super-admin/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'login-management':
                return <LoginManagement />;
            case 'overview':
                return <Overview />;
            case 'organizations':
            case 'org-onboarding':
            case 'org-settings':
                return <Organizations />;
            case 'create-org':
                return <CreateOrganization />;
            case 'approvals':
                return <Approvals />;
            case 'users':
            case 'user-roles':
            case 'user-audit':
                return <CreateUser />;
            default:
                return <Overview />;
        }
    };

    return (
        <div className="super-dashboard-layout">
            <div className="bg-gradients">
                <div className="gradient-1" />
                <div className="gradient-2" />
            </div>

            <SuperSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                handleLogout={handleLogout}
            />

            <div className={`main-viewport ${sidebarOpen ? '' : 'collapsed'}`}>
                <SuperHeader
                    activeTab={activeTab}
                    setSidebarOpen={setSidebarOpen}
                />
                <div className="content-area">
                    <div className="content-container">
                        {renderContent()}
                    </div>
                </div>

                {/* Movable Quick Action Widget */}
                <SuperQuickActions />
            </div>
        </div>
    );
};

export default SuperDashboard;
