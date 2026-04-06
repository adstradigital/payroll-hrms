import React, { useEffect, useState } from 'react';
import {
    Search,
    Bell,
    Moon,
    Sun,
    Menu,
    ChevronRight,
    Search as SearchIcon,
    User,
    LogOut,
    Settings
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import './SuperHeader.css';

const SuperHeader = ({ activeTab, setSidebarOpen }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const getInitials = (res) => {
        if (!res) return 'AM';
        const name = res.full_name || `${res.first_name || ''} ${res.last_name || ''}`.trim() || res.username || 'System Admin';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Use actual user data falling back to sensible defaults
    const displayName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Super Admin';
    const displayTitle = user?.is_superuser ? 'Super Administrator' : 'System Administrator';
    const displayEmail = user?.email || 'admin@hrms.com';

    return (
        <header className="super-header-nexus">
            <div className="header-left">
                <button
                    className="mobile-toggle lg-hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={20} />
                </button>
                <div className="nexus-breadcrumb">
                    <span className="breadcrumb-prefix">Admin</span>
                    <ChevronRight size={14} className="text-zinc-600" />
                    <span className="breadcrumb-label">
                        {activeTab.toUpperCase().replace('-', ' ')}
                    </span>
                </div>
            </div>

            <div className="header-right">
                <div className="header-actions">
                    <div className="search-minimal">
                        <SearchIcon size={16} className="text-zinc-500" />
                        <input type="text" placeholder="Search resources..." className="search-cmd" />
                    </div>

                    <button 
                        className="nexus-icon-btn" 
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
                    </button>
                    
                    <button className="nexus-icon-btn" title="System Notifications">
                        <Bell size={18} />
                    </button>
                </div>

                <div className="header-divider-nexus"></div>

                <div className="relative">
                    <div 
                        className="user-nexus-profile cursor-pointer select-none"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="user-info-nexus hidden-md">
                            <span className="user-name-nexus">{displayName}</span>
                            <span className="user-role-nexus">{displayTitle}</span>
                        </div>
                        <div className="user-avatar-nexus">
                            {getInitials(user)}
                        </div>
                    </div>

                    {showProfileMenu && (
                        <div className="profile-dropdown-nexus">
                            <div className="dropdown-header">
                                <span className="dropdown-name">{displayName}</span>
                                <span className="dropdown-email">{displayEmail}</span>
                            </div>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item">
                                <User size={16} />
                                <span>My Profile</span>
                            </button>
                            <button className="dropdown-item">
                                <Settings size={16} />
                                <span>Preferences</span>
                            </button>
                            <div className="dropdown-divider" />
                            <button 
                                className="dropdown-item logout-item"
                                onClick={logout}
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SuperHeader;
