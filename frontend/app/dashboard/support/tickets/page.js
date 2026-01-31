import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import SupportTickets from '@/components/ClientAdmin/Support/SupportTickets/SupportTickets';

export default function TicketsPage() {
    return (
        <Dashboard breadcrumbs={['Support', 'My Tickets']}>
            <SupportTickets />
        </Dashboard>
    );
}
