import { redirect } from 'next/navigation';

export default function OpenJobsRedirectPage() {
    redirect('/dashboard/recruitment/job-openings');
}

