import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ShiftRequest from '@/components/ClientAdmin/Account/Employees/ShiftRequest/ShiftRequest';

export default function ShiftRequestsPage() {
    return (
        <Dashboard breadcrumbs={['Employees', 'Shift Requests']}>
            <ShiftRequest />
        </Dashboard>
    );
}
