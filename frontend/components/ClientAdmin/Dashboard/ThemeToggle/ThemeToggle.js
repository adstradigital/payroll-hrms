'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className={`theme-toggle__track ${theme === 'dark' ? 'theme-toggle__track--dark' : ''}`}>
                <div className="theme-toggle__thumb">
                    {theme === 'light' ? (
                        <Sun size={14} className="theme-toggle__icon" />
                    ) : (
                        <Moon size={14} className="theme-toggle__icon" />
                    )}
                </div>
            </div>
        </button>
    );
}
