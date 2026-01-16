"use client";
import React from 'react';
import Link from 'next/link';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <h1 className="text-3xl font-bold mb-4 text-black dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome to your HRMS dashboard.</p>
            <Link href="/" className="text-blue-600 mt-4 inline-block">Back to home</Link>
        </div>
    );
}
