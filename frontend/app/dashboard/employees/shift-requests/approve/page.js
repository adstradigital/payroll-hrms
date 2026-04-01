import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import ShiftRequest from '@/components/ClientAdmin/Account/Employees/ShiftRequest/ShiftRequest';

export default function ShiftRequestsApprovePage() {
    return (
        <Dashboard breadcrumbs={['Employees', 'Shift Requests', 'Approve']}>
            <div className="admin-approve-banner" style={{ 
                padding: '16px 24px', 
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', 
                color: 'white', 
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Admin Approval Center</h2>
                    <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Review and manage pending shift change requests from across the organization.</p>
                </div>
            </div>
            <ShiftRequest approvalMode={true} />
        </Dashboard>
    );
}
