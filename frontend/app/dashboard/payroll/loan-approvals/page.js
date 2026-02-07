import LoanApprovals from '@/components/ClientAdmin/Payroll/LoanApprovals/LoanApprovals';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';

export default function LoanApprovalsPage() {
    return (
        <Dashboard
            title="Loan Approvals"
            subtitle="Manage Pending Loan Requests"
            breadcrumbs={['Dashboard', 'Payroll', 'Loan Approvals']}
        >
            <div className="container-fluid p-0">
                <LoanApprovals />
            </div>
        </Dashboard>
    );
}
