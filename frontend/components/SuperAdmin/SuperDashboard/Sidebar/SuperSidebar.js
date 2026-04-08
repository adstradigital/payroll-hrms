import React from 'react';
import {
    LayoutDashboard,
    Building2,
    ShieldCheck,
    Settings,
    Users,
    Activity,
    LogOut,
    ChevronRight,
    UserPlus,
    Key,
    Shield,
    Database,
    Globe,
    Zap,
    X,
    Menu,
    LifeBuoy
} from 'lucide-react';
import './SuperSidebar.css';

const SuperSidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, handleLogout }) => {
    
    const menuGroups = [
        {
            id: 'core',
            label: 'System Hub',
            items: [
                { id: 'overview', icon: LayoutDashboard, label: 'Control Center' },
                { id: 'approvals', icon: ShieldCheck, label: 'Access Queue' }
            ]
        },
        {
            id: 'management',
            label: 'Management',
            items: [
                { id: 'organizations', icon: Building2, label: 'Organizations' },
                { id: 'support', icon: LifeBuoy, label: 'Support Center' },
                { id: 'users', icon: UserPlus, label: 'User Roles' },
                { id: 'login-management', icon: Key, label: 'Login Control' }
            ]
        },
        {
            id: 'infrastructure',
            label: 'Infrastructure',
            items: [
                { id: 'user-audit', icon: Activity, label: 'Audit Logs' },
                { id: 'org-settings', icon: Settings, label: 'Global Settings' }
            ]
        }
    ];

    return (
        <>
            {/* Mobile Menu Toggle */}
            <button className="mobile-toggle lg-hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={24} />
            </button>

            {/* Backdrop for mobile */}
            <div 
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} 
                onClick={() => setSidebarOpen(false)}
            />

            <aside className={`super-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <ShieldCheck size={22} color="white" />
                        </div>
                        <div className="logo-text">
                            <h3>HRMS <span>PAYROLL</span></h3>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-content">
                    {menuGroups.map((group) => (
                        <div key={group.id} className="menu-group">
                            <span className="menu-label">{group.label}</span>
                            <div className="menu-items">
                                {group.items.map((item) => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            className={`menu-item ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                if (window.innerWidth < 1024) setSidebarOpen(false);
                                            }}
                                            title={item.label}
                                        >
                                            <item.icon size={20} className="menu-icon" />
                                            <span className="menu-text">{item.label}</span>
                                            {isActive && <div className="active-glow" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span className="menu-text">Terminate Session</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default SuperSidebar;
