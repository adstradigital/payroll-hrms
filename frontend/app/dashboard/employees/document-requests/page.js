import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import DocumentRequest from '@/components/ClientAdmin/Account/Employees/DocumentRequest/DocumentRequest';

export default function DocumentRequestsPage() {
    return (
        <Dashboard breadcrumbs={['Employees', 'Document Requests']}>
            <DocumentRequest />
        </Dashboard>
    );
}
