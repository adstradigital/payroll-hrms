'use client';

import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Settings from '@/components/ClientAdmin/Settings/Settings';

export default function SettingsPage() {
    return (
        <Dashboard breadcrumbs={['Home', 'Settings']} showGreeting={false}>
            <Settings />
        </Dashboard>
    );
}