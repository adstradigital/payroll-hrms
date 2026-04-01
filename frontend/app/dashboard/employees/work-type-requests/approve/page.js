import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import WorkTypeRequest from '@/components/ClientAdmin/Account/Employees/WorkTypeRequest/WorkTypeRequest';

export default function WorkTypeRequestsApprovePage() {
    return (
        <Dashboard breadcrumbs={['Employees', 'Work Type Requests', 'Approve']}>
            <div className="admin-approve-banner" style={{ 
                padding: '16px 24px', 
                background: 'linear-gradient(135deg, #059669, #10B981)', 
                color: 'white', 
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Work Mode Approval Center</h2>
                    <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Review and manage work mode (Remote/On-site/Hybrid) requests from across the organization.</p>
                </div>
            </div>
            <WorkTypeRequest approvalMode={true} />
        </Dashboard>
    );
}
