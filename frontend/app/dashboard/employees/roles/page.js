import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import RoleAndPermission from '@/components/ClientAdmin/Account/Employees/RoleAndPermission/RoleAndPermission';

export default function RolesPage() {
    return (
        <Dashboard
            title="Roles & Permissions"
            subtitle="Manage access control and role-based permissions"
            breadcrumbs={['Dashboard', 'Employees', 'Roles & Permissions']}
        >
            <RoleAndPermission />
        </Dashboard>
    );
}
