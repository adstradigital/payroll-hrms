
import * as XLSX from 'xlsx';
import { createEmployee, getAllDepartments, getAllDesignations } from './api_clientadmin';

// In-memory cache to store upload results since we don't have a backend table for "Upload Jobs"
const uploadResultsCache = new Map();

// Mock data (kept for other un-implemented types)
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

    // Combine mock data with real cached results
    const realUploads = Array.from(uploadResultsCache.values()).map(r => ({
        id: r.id,
        type: r.type,
        fileName: r.fileName,
        status: r.status,
        rows: r.totalRows,
        date: r.startedAt
    }));

    let uploads = [...realUploads, ...mockStats.recentUploads];

    // Simple mock filtering
    if (filters.status && filters.status !== 'all') {
        uploads = uploads.filter(u => u.status === filters.status);
    }
    if (filters.search) {
        const query = filters.search.toLowerCase();
        uploads = uploads.filter(u => u.fileName.toLowerCase().includes(query) || u.id.toLowerCase().includes(query));
    }

    return uploads;
};

export const getTemplates = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTemplates;
};

// --- HELPER: Read file as ArrayBuffer ---
const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
};

// --- HELPER: Process Employee Upload ---
const processEmployeeUpload = async (file, skipErrors) => {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (!jsonData || jsonData.length === 0) {
        throw new Error("The uploaded file is empty or invalid.");
    }

    // Fetch dependencies for mapping (Departments, Designations)
    const [deptRes, desigRes] = await Promise.all([
        getAllDepartments(),
        getAllDesignations()
    ]);
    const departments = deptRes.data.results || deptRes.data;
    const designations = desigRes.data.results || desigRes.data;

    // Check for empty master data
    if (!designations || designations.length === 0) {
        throw new Error("System has no Designations configured. Please add Designations in Settings first.");
    }
    // Departments check (optional warning could be here, but since it's optional in upload, we skip strict block)

    const summary = {
        totalRows: jsonData.length,
        successRows: 0,
        errorRows: 0,
        errors: [],
    };

    // Helper to find ID by Name
    const findIdByName = (list, name) => {
        if (!name) return null;
        const item = list.find(i => i.name.toLowerCase() === name.toString().toLowerCase().trim());
        return item ? item.id : null;
    };

    // Helper to get suggestions
    const getSuggestions = (list) => {
        return list.slice(0, 5).map(i => i.name).join(', ') + (list.length > 5 ? '...' : '');
    };

    // Iterate and Process
    // Using for...of loop to handle async sequentially
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // +1 for 0-index, +1 for header

        try {
            // Dictionary of required fields (Department and Designation are optional)
            const requiredFields = ['First Name', 'Last Name', 'Email', 'Employee ID', 'Date of Joining'];
            const missing = requiredFields.filter(f => !row[f]);

            if (missing.length > 0) {
                console.error("Row validation failed:", row, missing);
                throw new Error(`Mandatory fields missing: ${missing.join(', ')}`);
            }

            // Map Data
            const departmentId = row['Department'] ? findIdByName(departments, row['Department']) : null;
            const designationId = row['Designation'] ? findIdByName(designations, row['Designation']) : null;

            const payload = {
                first_name: row['First Name'],
                last_name: row['Last Name'],
                email: row['Email'],
                phone: row['Phone'] || '',
                employee_id: row['Employee ID'],
                date_of_birth: row['Date of Birth'] ? new Date(row['Date of Birth']).toISOString().split('T')[0] : null,
                gender: (row['Gender'] || 'male').toLowerCase(),
                department: departmentId,
                designation: designationId,
                date_of_joining: row['Date of Joining'] ? new Date(row['Date of Joining']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                employment_type: (row['Employment Type'] || 'permanent').toLowerCase().replace(' ', '_'),
                status: (row['Status'] || 'active').toLowerCase(),
                // User Account
                enable_login: false // Default to false for bulk upload for now
            };

            if (row['Department'] && !payload.department) {
                const avail = getSuggestions(departments);
                throw new Error(`Department '${row['Department']}' not found. Available: ${avail || 'None'}`);
            }
            if (row['Designation'] && !payload.designation) {
                const avail = getSuggestions(designations);
                throw new Error(`Designation '${row['Designation']}' not found. Available: ${avail || 'None'}`);
            }

            // Call API
            await createEmployee(payload);
            summary.successRows++;

        } catch (err) {
            summary.errorRows++;
            summary.errors.push({
                row: rowNum,
                column: 'Multiple',
                message: err.response?.data?.error || err.message || 'Unknown error',
                data: JSON.stringify(row)
            });

            if (!skipErrors) {
                // ... (logic remains same)
            }
        }
    }

    return summary;
};


export const uploadFile = async (type, file, skipErrors = false) => {
    // Generate an ID first
    const uploadId = `BLK-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    const startTime = new Date().toISOString();

    let resultSummary = {
        id: uploadId,
        type,
        fileName: file.name,
        status: 'processing',
        totalRows: 0,
        successRows: 0,
        errorRows: 0,
        startedAt: startTime,
        completedAt: null,
        errors: []
    };

    // Store initial state
    uploadResultsCache.set(uploadId, resultSummary);

    try {
        if (type === 'employee') {
            const processResult = await processEmployeeUpload(file, skipErrors);

            // Merge results
            resultSummary = {
                ...resultSummary,
                ...processResult,
                status: processResult.errorRows === 0 ? 'completed' : (processResult.successRows > 0 ? 'partial' : 'failed'),
                completedAt: new Date().toISOString()
            };
        } else {
            // Mock for others
            await new Promise(resolve => setTimeout(resolve, 2000));
            resultSummary.status = 'completed';
            resultSummary.totalRows = 100;
            resultSummary.successRows = 100;
            resultSummary.completedAt = new Date().toISOString();
        }

        // Update Cache
        uploadResultsCache.set(uploadId, resultSummary);
        return resultSummary;

    } catch (error) {
        console.error("Upload Error:", error);
        resultSummary.status = 'failed';
        resultSummary.completedAt = new Date().toISOString();
        resultSummary.errors.push({
            row: 0,
            column: 'General',
            message: error.message,
            data: ''
        });
        uploadResultsCache.set(uploadId, resultSummary);
        throw error;
    }
};

export const getUploadDetail = async (id) => {
    // Check cache first
    if (uploadResultsCache.has(id)) {
        return uploadResultsCache.get(id);
    }

    // Fallback to mock
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockStats.recentUploads.find(u => u.id === id) || {
        id,
        type: 'employee',
        fileName: 'unknown_file.xlsx',
        status: 'failed',
        totalRows: 0,
        successRows: 0,
        errorRows: 0,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        errors: [{ message: 'Upload details not found in cache (this is a mock session)' }]
    };
};

export const downloadTemplate = (templateId) => {
    if (templateId === 'employee' || templateId === 'employee_sample') {
        const headers = [
            'First Name', 'Last Name', 'Email', 'Phone',
            'Employee ID', // Designation and Department Removed
            'Date of Joining', 'Date of Birth', 'Gender',
            'Employment Type', 'Status'
        ];

        const sampleData = [
            {
                'First Name': 'John', 'Last Name': 'Doe', 'Email': 'john.doe@example.com', 'Phone': '1234567890',
                'Employee ID': 'EMP001', 'Designation': 'Software Engineer',
                'Date of Joining': '2023-01-15', 'Date of Birth': '1990-05-20', 'Gender': 'Male',
                'Employment Type': 'Permanent', 'Status': 'Active'
            },
            {
                'First Name': 'Jane', 'Last Name': 'Smith', 'Email': 'jane.smith@example.com', 'Phone': '9876543210',
                'Employee ID': 'EMP002', 'Designation': 'HR Manager',
                'Date of Joining': '2023-02-01', 'Date of Birth': '1988-11-10', 'Gender': 'Female',
                'Employment Type': 'Contract', 'Status': 'Active'
            }
        ];

        const wb = XLSX.utils.book_new();

        // If just template, we can make a sheet with just headers
        let ws;
        if (templateId === 'employee') {
            ws = XLSX.utils.aoa_to_sheet([headers]);
        } else {
            ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        }

        XLSX.utils.book_append_sheet(wb, ws, "Employees");
        const fileName = templateId === 'employee_sample' ? 'Employee_Upload_Sample.xlsx' : 'Employee_Upload_Template.xlsx';
        XLSX.writeFile(wb, fileName);
    } else {
        alert(`Template download for ${templateId} is not yet implemented.`);
    }
};
