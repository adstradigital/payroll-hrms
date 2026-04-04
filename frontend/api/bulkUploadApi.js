
import * as XLSX from 'xlsx';
import { 
    createEmployee, getAllDepartments, getAllDesignations,
    createDepartment, createDesignation, getOrganization,
    getAllEmployees, getSalaryStructures, getSalaryComponents, createEmployeeSalary,
    createAttendance
} from './api_clientadmin';

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

    // Session caches for newly created entities to avoid duplicates
    const sessionDepts = new Map(departments.map(d => [d.name.toLowerCase().trim(), d.id]));
    const sessionDesigs = new Map(designations.map(d => [d.name.toLowerCase().trim(), d.id]));

    // Get current organization ID for auto-creation
    let companyId = null;
    try {
        const orgRes = await getOrganization();
        companyId = orgRes.data.id || orgRes.data.organization?.id;
    } catch (e) {
        console.error("Failed to fetch organization context:", e);
    }

    const ensureDepartment = async (name) => {
        if (!name) return null;
        const key = name.toString().toLowerCase().trim();
        if (sessionDepts.has(key)) return sessionDepts.get(key);
        
        try {
            console.log(`Auto-creating department: ${name}`);
            const res = await createDepartment({ name: name.trim(), company: companyId });
            const newId = res.data.id;
            sessionDepts.set(key, newId);
            return newId;
        } catch (e) {
            console.error(`Failed to auto-create department ${name}:`, e);
            return null;
        }
    };

    const ensureDesignation = async (name) => {
        if (!name) return null;
        const key = name.toString().toLowerCase().trim();
        if (sessionDesigs.has(key)) return sessionDesigs.get(key);
        
        try {
            console.log(`Auto-creating designation: ${name}`);
            const res = await createDesignation({ 
                name: name.trim(), 
                company: companyId,
                code: name.trim().toLowerCase().replace(/\s+/g, '-'),
                level: 1
            });
            const newId = res.data.id;
            sessionDesigs.set(key, newId);
            return newId;
        } catch (e) {
            console.error(`Failed to auto-create designation ${name}:`, e);
            return null;
        }
    };

    // Iterate and Process
    // Using for...of loop to handle async sequentially
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // +1 for 0-index, +1 for header

        try {
            // Dictionary of required fields (Department, Designation, Emp ID, and DoJ are optional/auto-generated)
            const requiredFields = ['First Name', 'Last Name', 'Email'];
            const missing = requiredFields.filter(f => !row[f]);

            if (missing.length > 0) {
                console.error("Row validation failed:", row, missing);
                throw new Error(`Mandatory fields missing: ${missing.join(', ')}`);
            }

            // Map Data (Auto-creating if missing)
            const departmentId = row['Department'] ? await ensureDepartment(row['Department']) : null;
            const designationId = row['Designation'] ? await ensureDesignation(row['Designation']) : null;

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

            if (row['Designation'] && !payload.designation) {
                throw new Error(`Designation '${row['Designation']}' could not be matched or created.`);
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
                throw new Error(`Upload halted at row ${rowNum}: ${err.response?.data?.error || err.message}`);
            }
        }
    }

    return summary;
};

// --- HELPER: Process Salary Upload ---
const processSalaryUpload = async (file, onProgress, skipErrors) => {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (!jsonData || jsonData.length === 0) {
        throw new Error("The uploaded file is empty or invalid.");
    }

    const formatDateForBackend = (val) => {
        if (!val) return new Date().toISOString().split('T')[0];
        try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    };

    const [empRes, structRes, compRes] = await Promise.all([
        getAllEmployees({ limit: 1000 }), 
        getSalaryStructures(),
        getSalaryComponents()
    ]);

    const employees = empRes.data.results || empRes.data;
    const structures = structRes.data.results || structRes.data;
    const components = compRes.data.results || compRes.data;

    const summary = {
        totalRows: jsonData.length,
        successRows: 0,
        errorRows: 0,
        errors: [],
    };

    const empMap = new Map(employees.map(e => [e.employee_id?.toString().toLowerCase().trim(), e.id]));
    const structMap = new Map(structures.map(s => [s.name.toLowerCase().trim(), s.id]));
    const compMap = new Map(components.filter(c => c.is_active).map(c => [c.name.toLowerCase().trim(), c.id]));

    for (let i = 0; i < jsonData.length; i++) {
        const rawRow = jsonData[i];
        const rowNum = i + 2;

        if (Object.values(rawRow).every(v => v === undefined || v === null || v === '')) {
            summary.totalRows--;
            continue;
        }

        const row = {};
        Object.keys(rawRow).forEach(k => {
            row[k.toLowerCase().trim()] = rawRow[k];
        });

        try {
            const getVal = (possibleKeys) => {
                const foundKey = Object.keys(row).find(k => 
                    possibleKeys.some(pk => k.includes(pk) || pk.includes(k))
                );
                return foundKey ? row[foundKey] : undefined;
            };

            const rawEmpId = getVal(['employee id', 'empid', 'emp_id', 'employee_id']);
            const employeeIdStr = rawEmpId?.toString().toLowerCase().trim();
            const empUuid = empMap.get(employeeIdStr);

            if (!empUuid) {
                const headersStr = Object.keys(rawRow).join(', ');
                throw new Error(`Employee ID '${rawEmpId || 'N/A'}' not found. Available columns mapping failed.`);
            }

            const rawBasic = getVal(['basic salary', 'basicsalary', 'basic_salary', 'basic']);
            if (rawBasic === undefined || rawBasic === null || rawBasic === '') {
                throw new Error("Mandatory field 'Basic Salary' missing.");
            }

            const structName = getVal(['salary structure', 'salarystructure', 'salary_structure', 'structure'])?.toString().toLowerCase().trim();
            const structUuid = structName ? structMap.get(structName) : null;

            const rowComponents = [];
            Object.keys(row).forEach(key => {
                const compId = compMap.get(key); 
                const amount = parseFloat(row[key]);
                if (compId && !isNaN(amount)) {
                    rowComponents.push({ component: compId, amount: amount });
                }
            });

            const payload = {
                employee: empUuid,
                salary_structure: structUuid,
                basic_salary: parseFloat(rawBasic),
                effective_from: formatDateForBackend(getVal(['effective from', 'effective', 'date'])),
                is_current: true,
                remarks: row['remarks'] || 'Bulk upload',
                components: rowComponents
            };

            await createEmployeeSalary(payload);
            summary.successRows++;
        } catch (err) {
            summary.errorRows++;
            summary.errors.push({
                row: rowNum,
                column: 'Multiple',
                message: err.response?.data?.error || (err.response?.data ? JSON.stringify(err.response.data) : err.message),
                data: JSON.stringify(rawRow)
            });
            if (!skipErrors) {
                throw new Error(`Upload halted at row ${rowNum}: ${err.message}`);
            }
        }
    }
    return summary;
};

/**
 * Format Date to YYYY-MM-DD (Attendance specific)
 */
function formatDateForAttendance(dateRaw) {
    if (!dateRaw) return null;
    if (typeof dateRaw === 'number') {
        const date = XLSX.SSF.parse_date_code(dateRaw);
        return `${date.y}-${date.m.toString().padStart(2, '0')}-${date.d.toString().padStart(2, '0')}`;
    }
    try {
        const d = new Date(dateRaw);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) { return null; }
}

/**
 * Process Attendance Bulk Upload
 */
async function processAttendanceUpload(file, onProgress, skipErrors) {
    const startedAt = new Date().toISOString();
    const uploadId = `BLK-ATT-${Date.now()}`;
    const result = { id: uploadId, type: 'attendance', fileName: file.name, status: 'processing', totalRows: 0, successRows: 0, errorRows: 0, errors: [], startedAt };
    uploadResultsCache.set(uploadId, result);

    try {
        const buffer = await readFileAsArrayBuffer(file);
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (!jsonData || jsonData.length === 0) throw new Error("The uploaded file is empty.");
        result.totalRows = jsonData.length;

        onProgress?.(5, "Fetching employee data...");
        const empRes = await getAllEmployees({ limit: 1000 });
        const employees = empRes.data.results || empRes.data;
        const empMap = new Map(employees.map(e => [e.employee_id?.toString().toLowerCase().trim(), e.id]));

        for (let i = 0; i < jsonData.length; i++) {
            const rawRow = jsonData[i];
            const rowNum = i + 2;
            if (Object.values(rawRow).every(v => !v)) { result.totalRows--; continue; }

            const progress = 10 + Math.floor((i / jsonData.length) * 80);
            onProgress?.(progress, `Processing row ${rowNum} of ${jsonData.length}...`);

            const row = {};
            Object.keys(rawRow).forEach(k => { row[k.toLowerCase().trim()] = rawRow[k]; });

            try {
                const getVal = (keys) => {
                    const foundKey = Object.keys(row).find(k => keys.some(pk => k.includes(pk) || pk.includes(k)));
                    return foundKey ? row[foundKey] : undefined;
                };

                const rawEmpId = getVal(['employee id', 'empid', 'emp_id', 'employee_id', 'id']);
                const dateRaw = getVal(['date', 'day']);
                const checkInRaw = getVal(['check-in', 'checkin', 'check_in', 'in time', 'clock in']);
                const checkOutRaw = getVal(['check-out', 'checkout', 'check_out', 'out time', 'clock out']);
                const statusRaw = getVal(['status', 'attendance']);
                const remarksRaw = getVal(['remarks', 'note', 'reason', 'comment']);

                if (!rawEmpId) throw new Error("Employee ID is missing.");
                if (!dateRaw) throw new Error("Date is missing.");

                const empUuid = empMap.get(rawEmpId.toString().toLowerCase().trim());
                if (!empUuid) throw new Error(`Employee ID '${rawEmpId}' not found.`);

                const formattedDate = formatDateForAttendance(dateRaw);
                if (!formattedDate) throw new Error(`Invalid date format: ${dateRaw}`);

                const formatTime = (timeRaw) => {
                    if (!timeRaw) return null;
                    if (timeRaw instanceof Date) return timeRaw.toTimeString().split(' ')[0];
                    if (typeof timeRaw === 'number') {
                        const totalSeconds = Math.round(timeRaw * 86400);
                        const h = Math.floor(totalSeconds / 3600);
                        const m = Math.floor((totalSeconds % 3600) / 60);
                        const s = totalSeconds % 60;
                        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    }
                    return timeRaw.toString();
                };

                const checkInTime = formatTime(checkInRaw);
                const checkOutTime = formatTime(checkOutRaw);

                const mapStatus = (s) => {
                    const l = (s || 'present').toString().toLowerCase().trim();
                    if (l.includes('absent')) return 'absent';
                    if (l.includes('half')) return 'half_day';
                    if (l.includes('leave')) return 'on_leave';
                    if (l.includes('holiday')) return 'holiday';
                    if (l.includes('late')) return 'late';
                    return 'present';
                };

                const payload = {
                    employee: empUuid,
                    date: formattedDate,
                    check_in_time: checkInTime ? `${formattedDate}T${checkInTime}` : null,
                    check_out_time: checkOutTime ? `${formattedDate}T${checkOutTime}` : null,
                    status: mapStatus(statusRaw),
                    remarks: remarksRaw || 'Bulk upload'
                };

                await createAttendance(payload);
                result.successRows++;
            } catch (err) {
                result.errorRows++;
                const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                result.errors.push({ row: rowNum, message: msg });
                if (!skipErrors) {
                    result.status = 'failed';
                    onProgress?.(100, `Upload halted at row ${rowNum}: ${msg}`);
                    return result;
                }
            }
        }
        result.status = result.errorRows > 0 ? 'partial' : 'completed';
        onProgress?.(100, `Completed. Success: ${result.successRows}, Errors: ${result.errorRows}`);
    } catch (err) {
        result.status = 'failed';
        result.errors.push({ row: 0, message: err.message });
        onProgress?.(100, `Critical Error: ${err.message}`);
    }
    result.completedAt = new Date().toISOString();
    uploadResultsCache.set(uploadId, result);
    return result;
};

export const uploadFile = async (type, file, onProgress, skipErrors = false) => {
    const uploadId = `BLK-${Date.now()}`;
    const startTime = new Date().toISOString();
    
    let resultSummary = {
        id: uploadId, type, fileName: file.name, status: 'processing',
        totalRows: 0, successRows: 0, errorRows: 0, startedAt: startTime, completedAt: null, errors: []
    };

    uploadResultsCache.set(uploadId, resultSummary);

    try {
        if (type === 'salary') return await processSalaryUpload(file, onProgress, skipErrors);
        if (type === 'attendance') return await processAttendanceUpload(file, onProgress, skipErrors);
        if (type === 'employee') {
            const empResult = await processEmployeeUpload(file, skipErrors);
            resultSummary = { ...resultSummary, ...empResult, status: empResult.errorRows === 0 ? 'completed' : 'partial', completedAt: new Date().toISOString() };
            uploadResultsCache.set(uploadId, resultSummary);
            return resultSummary;
        }
        
        // Default Mock
        await new Promise(r => setTimeout(r, 1000));
        resultSummary.status = 'completed';
        resultSummary.completedAt = new Date().toISOString();
        return resultSummary;
    } catch (error) {
        resultSummary.status = 'failed';
        resultSummary.completedAt = new Date().toISOString();
        resultSummary.errors.push({ row: 0, message: error.message });
        uploadResultsCache.set(uploadId, resultSummary);
        throw error;
    }
};

export const getUploadDetail = async (id) => {
    if (uploadResultsCache.has(id)) return uploadResultsCache.get(id);
    await new Promise(r => setTimeout(r, 500));
    return mockStats.recentUploads.find(u => u.id === id) || { id, fileName: 'unknown', status: 'failed', errors: [{ message: 'Not found' }] };
};

export const downloadTemplate = (templateId) => {
    let headers = [];
    if (templateId === 'employee' || templateId === 'employee_sample') {
        headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Employee ID', 'Date of Joining', 'Date of Birth', 'Gender', 'Employment Type', 'Status'];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, "Employees");
        XLSX.writeFile(wb, 'Employee_Template.xlsx');
    } else if (templateId === 'salary' || templateId === 'salary_sample') {
        headers = ['Employee ID', 'Salary Structure', 'Basic Salary', 'Effective From', 'Remarks', 'HRA', 'Conveyance'];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, "Salary_Data");
        XLSX.writeFile(wb, 'Salary_Template.xlsx');
    } else if (templateId === 'attendance') {
        headers = ['Employee ID', 'Date', 'Check-In', 'Check-Out', 'Status', 'Remarks'];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, "Attendance_Data");
        XLSX.writeFile(wb, 'Attendance_Template.xlsx');
    }
};
