import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import HelpCenter from '@/components/ClientAdmin/Support/HelpCenter/HelpCenter';

export default function HelpCenterPage() {
    return (
        <Dashboard breadcrumbs={['Support', 'Help Center']}>
            <HelpCenter />
        </Dashboard>
    );
}
