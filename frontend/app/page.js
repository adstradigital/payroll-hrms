"use client";
import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950 text-black dark:text-white transition-colors duration-300">
            <header className="absolute top-0 right-0 p-4">
                <ThemeToggle />
            </header>

            <div className="text-center space-y-6 max-w-2xl">
                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Payroll & HRMS Portal
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Comprehensive HR and Payroll solution for your organization.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link href="/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
                        Login
                    </Link>
                    <Link href="/dashboard" className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white font-semibold rounded-lg shadow-md transition-all border border-gray-200 dark:border-gray-700">
                        Dashboard
                    </Link>
                </div>
            </div>

            <footer className="mt-20">
                <p className="text-sm text-gray-500">© 2026 Payroll-HRMS SaaS</p>
            </footer>
        </main>
    );
}
