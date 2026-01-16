'use client';

import { Search, Bell } from 'lucide-react';
import ThemeToggle from '@/components/ClientAdmin/Dashboard/ThemeToggle/ThemeToggle';
import './Header.css';

export default function Header({ title, subtitle, breadcrumbs = [] }) {
    return (
        <header className="header">
            <div className="header__left">
                {/* Breadcrumbs */}
                {breadcrumbs.length > 0 && (
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
                )}
            </div>

            <div className="header__right">
                {/* Search */}
                <div className="header__search">
                    <Search size={18} className="header__search-icon" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="header__search-input"
                    />
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <button className="header__notification-btn">
                    <Bell size={20} />
                    <span className="header__notification-badge">3</span>
                </button>
            </div>
        </header>
    );
}
