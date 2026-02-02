import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import TicketDetail from '@/components/ClientAdmin/Support/TicketDetail/TicketDetail';

export default function TicketDetailPage({ params }) {
    return (
        <Dashboard breadcrumbs={['Support', 'My Tickets', 'Ticket Detail']}>
            <TicketDetail ticketId={params.id} />
        </Dashboard>
    );
}
