import React, { useState } from 'react';
import {
    LayoutDashboard,
    ShieldCheck,
    X,
    Building2,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Activity,
    CreditCard
} from 'lucide-react';
import './SuperSidebar.css';

const SuperSidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, handleLogout }) => {
    const [expandedGroups, setExpandedGroups] = useState({
        'client-group': true
    });

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        {
            id: 'client-group',
            label: 'Client Management',
            icon: Building2,
            subItems: [
                { id: 'organizations', label: 'Organizations' },
                { id: 'create-org', label: 'Register Organization' },
                { id: 'approvals', label: 'Approvals' },
                { id: 'users', label: 'User Directory' },
                { id: 'login-management', label: 'Login Management' },
            ]
        },
    ];

    const isSubItemActive = (item) => {
        if (!item.subItems) return activeTab === item.id;
        return item.subItems.some(sub => sub.id === activeTab);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`super-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <ShieldCheck size={20} color="white" />
                        </div>
                        {sidebarOpen && (
                            <div className="logo-text">
                                <h3>HRMS<span>Admin</span></h3>
                            </div>
                        )}
                    </div>
                    {sidebarOpen && (
                        <button className="sidebar-close lg-hidden" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="sidebar-content">
                    <div className="menu-group">
                        <div className="menu-label">{sidebarOpen ? 'Main Menu' : '•••'}</div>
                        <div className="menu-items">
                            {menuItems.map((item) => (
                                <div key={item.id} className="menu-item-wrapper">
                                    {item.subItems ? (
                                        <div className="expandable-group">
                                            <button
                                                className={`menu-item ${isSubItemActive(item) ? 'active' : ''}`}
                                                onClick={() => sidebarOpen ? toggleGroup(item.id) : setActiveTab(item.subItems[0].id)}
                                                title={!sidebarOpen ? item.label : ''}
                                            >
                                                <item.icon size={20} className="menu-icon" />
                                                {sidebarOpen && (
                                                    <>
                                                        <span className="menu-text">{item.label}</span>
                                                        {expandedGroups[item.id] ? (
                                                            <ChevronDown size={14} className="expand-chevron" />
                                                        ) : (
                                                            <ChevronRight size={14} className="expand-chevron" />
                                                        )}
                                                    </>
                                                )}
                                            </button>

                                            {sidebarOpen && expandedGroups[item.id] && (
                                                <div className="sub-menu-items">
                                                    <div className="sub-menu-line"></div>
                                                    {item.subItems.map(sub => (
                                                        <button
                                                            key={sub.id}
                                                            className={`sub-item ${activeTab === sub.id ? 'active' : ''}`}
                                                            onClick={() => setActiveTab(sub.id)}
                                                        >
                                                            <div className={`sub-dot ${activeTab === sub.id ? 'active' : ''}`}></div>
                                                            <span>{sub.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                                            onClick={() => setActiveTab(item.id)}
                                            title={!sidebarOpen ? item.label : ''}
                                        >
                                            <item.icon size={20} className="menu-icon" />
                                            {sidebarOpen && <span className="menu-text">{item.label}</span>}
                                            {sidebarOpen && activeTab === item.id && <div className="active-dot"></div>}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sidebar-footer">
                    {sidebarOpen && (
                        <div className="health-widget">
                            <span className="widget-label">System Health</span>
                            <div className="status-flex">
                                <div className="status-indicator online pulse"></div>
                                <span className="status-text">Operational</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '98%' }}></div>
                            </div>
                        </div>
                    )}

                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={18} />
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default SuperSidebar;
