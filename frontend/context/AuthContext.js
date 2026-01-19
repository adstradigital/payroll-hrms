'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { logout as apiLogout } from '@/api/api_clientadmin';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedUser = Cookies.get('user');
        const accessToken = localStorage.getItem('accessToken');

        console.log('AuthContext init - savedUser:', savedUser);
        console.log('AuthContext init - accessToken exists:', !!accessToken);

        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                console.log('AuthContext - User loaded:', parsedUser);
                console.log('AuthContext - User role:', parsedUser.role);
                setUser(parsedUser);
            } catch (err) {
                console.error('Failed to parse user cookie', err);
            }
        } else if (!accessToken) {
            // DEV MODE fallback - only use if no real auth exists
            console.log('AuthContext - Using DEV fallback user');
            setUser({
                name: 'Dev Admin',
                email: 'admin@example.com',
                company: 'HR Nexus Demo',
                subscription_plan: 'both',
                role: 'admin'
            });
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    };

    const logout = async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error('Backend logout failed:', error);
        } finally {
            setUser(null);
            Cookies.remove('user');
            Cookies.remove('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/login');
        }
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
