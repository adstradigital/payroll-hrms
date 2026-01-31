import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import CreateTicketForm from '@/components/ClientAdmin/Support/CreateTicketForm/CreateTicketForm';

export default function NewTicketPage() {
    return (
        <Dashboard breadcrumbs={['Support', 'My Tickets', 'Create Ticket']}>
            <CreateTicketForm />
        </Dashboard>
    );
}
