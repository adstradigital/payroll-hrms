"use client";
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
};

export default ThemeToggle;
