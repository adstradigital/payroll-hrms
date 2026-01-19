import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import Departments from '@/components/ClientAdmin/Account/Employees/Departments/Departments';

export default function DepartmentsPage() {
    return (
        <Dashboard
            title="Departments"
            subtitle="Organize your workforce by department"
            breadcrumbs={['Dashboard', 'Employees', 'Departments']}
        >
            <Departments />
        </Dashboard>
    );
}
