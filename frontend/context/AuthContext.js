'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session in cookies/localStorage
        const savedUser = Cookies.get('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error('Failed to parse user cookie', err);
            }
        } else {
            // DEV MODE: Set a default user so the UI is not empty
            setUser({
                name: 'Dev Admin',
                email: 'admin@example.com',
                company: 'HR Nexus Demo',
                subscription_plan: 'both', // Enables both HRMS and Payroll
                role: 'owner'
            });
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        Cookies.set('user', JSON.stringify(userData), { expires: 7 }); // Save for 7 days
    };

    const logout = () => {
        setUser(null);
        Cookies.remove('user');
        Cookies.remove('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const updateSubscription = (plan) => {
        if (user) {
            const updatedUser = { ...user, subscription_plan: plan };
            setUser(updatedUser);
            Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateSubscription }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
