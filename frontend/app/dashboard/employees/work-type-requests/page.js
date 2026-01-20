import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import WorkTypeRequest from '@/components/ClientAdmin/Account/Employees/WorkTypeRequest/WorkTypeRequest';

export default function WorkTypeRequestsPage() {
    return (
        <Dashboard breadcrumbs={['Employees', 'Work Type Requests']}>
            <WorkTypeRequest />
        </Dashboard>
    );
}
