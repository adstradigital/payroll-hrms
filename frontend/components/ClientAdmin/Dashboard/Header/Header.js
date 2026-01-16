'use client';

import { Search, Bell, Settings, Globe, ChevronDown } from 'lucide-react';
import ThemeToggle from '@/components/ClientAdmin/Dashboard/ThemeToggle/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import './Header.css';

export default function Header({ title, subtitle, breadcrumbs = [] }) {
    const { user } = useAuth();
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD';

    return (
        <header className="header">
            <div className="header__left">
                {/* Breadcrumbs & Title Stack */}
                <div className="header__brand">
                    <nav className="header__breadcrumbs">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={index} className="header__breadcrumb">
                                {crumb}
                                {index < breadcrumbs.length - 1 && (
                                    <span className="header__breadcrumb-separator">›</span>
                                )}
                            </span>
                        ))}
                    </nav>
                    <h1 className="header__title">{title || breadcrumbs[breadcrumbs.length - 1]}</h1>
                </div>
            </div>

            <div className="header__center">
                {/* Centered Search */}
                <div className="header__search">
                    <Search size={16} className="header__search-icon" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="header__search-input"
                    />
                </div>
            </div>

            <div className="header__right">
                {/* Language Switcher */}
                <button className="header__utility-btn header__language">
                    <Globe size={18} />
                    <span>EN</span>
                    <ChevronDown size={14} />
                </button>

                {/* Settings */}
                <button className="header__utility-btn">
                    <Settings size={18} />
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <button className="header__utility-btn">
                    <Bell size={18} />
                    <span className="header__notification-dot"></span>
                </button>

                {/* User Section */}
                <div className="header__divider"></div>
                <div className="header__user">
                    <div className="header__avatar">{initials}</div>
                </div>
            </div>
        </header>
    );
}
