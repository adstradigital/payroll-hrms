
const mockStats = {
    totalUploads: 145,
    successRate: 92,
    failedUploads: 12,
    pendingUploads: 3,
    recentUploads: [
        { id: 'BLK-2024-001', type: 'employee', fileName: 'employees_jan_2024.xlsx', status: 'completed', rows: 450, date: '2024-01-28T10:30:00' },
        { id: 'BLK-2024-002', type: 'salary', fileName: 'salary_revised.csv', status: 'failed', rows: 120, date: '2024-01-29T14:15:00' },
        { id: 'BLK-2024-003', type: 'attendance', fileName: 'attendance_week4.xlsx', status: 'processing', rows: 890, date: '2024-01-30T09:00:00' },
        { id: 'BLK-2024-004', type: 'tax', fileName: 'tax_declarations.csv', status: 'completed', rows: 50, date: '2024-01-30T11:20:00' },
        { id: 'BLK-2024-005', type: 'reimbursement', fileName: 'reimb_claims.xlsx', status: 'partial', rows: 25, date: '2024-01-30T15:45:00' },
    ]
};

const mockTemplates = [
    { id: 'employee', name: 'Employee Data', description: 'Upload new employees or update existing details', version: 'v2.1', lastUpdated: '2024-01-15' },
    { id: 'salary', name: 'Salary Data', description: 'Update salary structures and recurring payments', version: 'v1.5', lastUpdated: '2023-12-10' },
    { id: 'attendance', name: 'Attendance Logs', description: 'Import daily attendance logs and shift timings', version: 'v3.0', lastUpdated: '2024-01-20' },
    { id: 'tax', name: 'Tax Declarations', description: 'Import employee tax declaration data', version: 'v1.2', lastUpdated: '2023-11-05' },
    { id: 'reimbursement', name: 'Reimbursements', description: 'Upload expense claims and reimbursement data', version: 'v1.0', lastUpdated: '2023-10-25' },
    { id: 'loan', name: 'Loan & Advances', description: 'Import loan requests and disbursement details', version: 'v1.1', lastUpdated: '2023-11-15' },
];

export const getDashboardStats = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockStats;
};

export const getUploadHistory = async (filters = {}) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    let uploads = [...mockStats.recentUploads, ...mockStats.recentUploads, ...mockStats.recentUploads]; // Generate more mock data

    // Simple mock filtering
    if (filters.status && filters.status !== 'all') {
        uploads = uploads.filter(u => u.status === filters.status);
    }
    if (filters.search) {
        const query = filters.search.toLowerCase();
        uploads = uploads.filter(u => u.fileName.toLowerCase().includes(query) || u.id.toLowerCase().includes(query));
    }

    return uploads.map((u, i) => ({ ...u, id: `${u.id}-${i}` })); // Ensure unique IDs
};

export const getTemplates = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTemplates;
};

export const uploadFile = async (type, file) => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time

    // Simulate random success/failure
    const random = Math.random();
    if (random < 0.1) throw new Error('Network interruption during upload');

    return {
        id: `BLK-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        type,
        fileName: file.name,
        status: 'processing',
        rows: Math.floor(Math.random() * 500) + 10,
        date: new Date().toISOString()
    };
};

export const getUploadDetail = async (id) => {
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
        id,
        type: 'employee',
        fileName: 'employees_jan_2024.xlsx',
        status: 'failed',
        totalRows: 150,
        successRows: 145,
        errorRows: 5,
        startedAt: '2024-01-29T14:15:00',
        completedAt: '2024-01-29T14:16:30',
        errors: [
            { row: 12, column: 'Email', message: 'Invalid email format', data: 'john.doe@invalid' },
            { row: 45, column: 'PAN', message: 'PAN number already exists', data: 'ABCDE1234F' },
            { row: 89, column: 'Joining Date', message: 'Date cannot be in the future', data: '2025-01-01' },
            { row: 102, column: 'Department', message: 'Department "Legal" not found', data: 'Legal' },
            { row: 134, column: 'Salary', message: 'Must be a positive number', data: '-5000' },
        ]
    };
};
