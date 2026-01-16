"use client";
import React from 'react';
import Link from 'next/link';

export default function Login() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-8">
            <div className="bg-white dark:bg-gray-950 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">Sign In</h1>
                <div className="space-y-4">
                    <input type="email" placeholder="Email" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
                    <input type="password" placeholder="Password" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
                    <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors">Sign In</button>
                </div>
                <Link href="/" className="text-sm text-blue-600 mt-4 block text-center">Back to home</Link>
            </div>
        </div>
    );
}
