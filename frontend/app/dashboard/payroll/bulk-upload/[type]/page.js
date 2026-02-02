'use client';

import { useParams } from 'next/navigation';
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import UploadTypePage from '@/components/ClientAdmin/BulkUpload/UploadTypePage';

export default function GenericUploadPage() {
    const params = useParams();
    const type = params.type;

    const typeConfig = {
        employee: { title: 'Employee Data Import', description: 'Upload employee details including personal info, contact, and job roles.' },
        salary: { title: 'Salary Structure Import', description: 'Update salary components and recurring payment details.' },
        attendance: { title: 'Attendance Log Import', description: 'Upload daily attendance logs or shift timings.' },
        tax: { title: 'Tax Declarations Import', description: 'Import employee tax declaration data for the financial year.' },
        reimbursement: { title: 'Reimbursement Claims Import', description: 'Bulk upload approved expense claims.' },
        loans: { title: 'Loan & Advance Import', description: 'Import loan requests and disbursement details.' }
    };

    const config = typeConfig[type] || { title: 'Bulk Upload', description: 'Upload data file.' };

    return (
        <Dashboard>
            <UploadTypePage
                type={type}
                title={config.title}
                description={config.description}
            />
        </Dashboard>
    );
}
