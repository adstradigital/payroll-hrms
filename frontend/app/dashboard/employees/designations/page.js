import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Designations from '@/components/ClientAdmin/Account/Employees/Designations/Designations';

export default function DesignationsPage() {
    return (
        <Dashboard
            title="Designations"
            subtitle="Manage job titles and automatic role mapping"
            breadcrumbs={['Dashboard', 'Employees', 'Designations']}
        >
            <Designations />
        </Dashboard>
    );
}
