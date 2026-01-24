import React, { useState } from 'react';
import {
    Search,
    Bell,
    User,
    Moon,
    Sun,
    HelpCircle,
    Command,
    ExternalLink,
    Menu, // Added Menu
    ChevronRight // Added ChevronRight
} from 'lucide-react';
import './SuperHeader.css';

const SuperHeader = ({ activeTab, setSidebarOpen }) => {
    return (
        <header className="super-header">
            <div className="header-left">
                <button
                    className="mobile-toggle lg-hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={24} />
                </button>
                <nav className="breadcrumb">
                    <span className="breadcrumb-root">Super Admin</span>
                    <ChevronRight size={14} className="breadcrumb-sep" />
                    <span className="breadcrumb-current">
                        {activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                </nav>
            </div>

            <div className="header-right">
                <div className="search-wrapper hidden-md">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Global search..."
                        className="search-input"
                    />
                </div>

                <div className="header-actions">
                    <button className="icon-btn" title="Notifications">
                        <Bell size={20} />
                        <span className="notification-dot"></span>
                    </button>
                </div>

                <div className="header-divider"></div>

                <div className="user-profile">
                    <div className="user-text hidden-md">
                        <span className="user-fullname">Alex Morgan</span>
                        <span className="user-title">Super Administrator</span>
                    </div>
                    <div className="user-avatar-premium">
                        AM
                    </div>
                </div>
            </div>
        </header>
    );
};

export default SuperHeader;
