import { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, Users,
    TrendingUp, CheckCircle, Clock,
    AlertCircle, Loader2, Download,
    RefreshCcw, ChevronRight
} from 'lucide-react';
import { getAllLeaveBalances, allocateLeaves, getAllEmployees, runLeaveAccrual } from '@/api/api_clientadmin';
import './LeaveBalance.css';

export default function LeaveBalance() {
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isAllocating, setIsAllocating] = useState(false);

    // Years for selector
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    useEffect(() => {
        fetchBalances();
    }, [selectedYear]);

    const fetchBalances = async () => {
        try {
            setLoading(true);
            const res = await getAllLeaveBalances({ year: selectedYear });
            const data = res.data.results || (Array.isArray(res.data) ? res.data : []);
            setBalances(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching balances:', err);
            setError('Failed to load leave balances.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAllocate = async () => {
        if (!confirm(`Are you sure you want to allocate leaves for ALL employees for the year ${selectedYear}? This will create balance records based on Leave Type configurations.`)) {
            return;
        }

        try {
            setIsAllocating(true);

            // Get all employees first to get their IDs
            const empRes = await getAllEmployees();
            const employees = empRes.data.results || (Array.isArray(empRes.data) ? empRes.data : []);
            const employeeIds = employees.map(emp => emp.id);

            // Get company ID from the first employee or user session (assuming same company)
            // For now we'll rely on the backend to handle organization if we don't pass it, 
            // but the backend allocate action expects 'company'
            // Let's check the organization
            if (employees.length === 0) {
                alert('No employees found to allocate leaves for.');
                return;
            }

            const companyId = employees[0].company;

            await allocateLeaves({
                employees: employeeIds,
                year: selectedYear,
                company: companyId
            });

            alert('Leave allocation completed successfully!');
            await fetchBalances();
        } catch (err) {
            console.error('Error allocating leaves:', err);
            alert('Failed to allocate leaves. ' + (err.response?.data?.error || ''));
        } finally {
            setIsAllocating(false);
        }
    };

    const handleRunAccrual = async () => {
        if (!confirm('Run periodic leave accrual for all active leave types? This will credit leave days to employees based on their accrual settings (Monthly/Quarterly).')) {
            return;
        }

        try {
            setIsAllocating(true);
            const empRes = await getAllEmployees();
            const employees = empRes.data.results || (Array.isArray(empRes.data) ? empRes.data : []);
            if (employees.length === 0) {
                alert('No employees found.');
                return;
            }
            const companyId = employees[0].company;

            await runLeaveAccrual(companyId);

            alert('Leave accrual process completed successfully!');
            await fetchBalances();
        } catch (err) {
            console.error('Error running accrual:', err);
            alert('Failed to run accrual. ' + (err.response?.data?.error || ''));
        } finally {
            setIsAllocating(false);
        }
    };

    const filteredBalances = balances.filter(b => {
        const empName = b.employee_name || '';
        const empId = b.employee_id_display || '';
        const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            empId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Stats
    const totalAllocated = filteredBalances.reduce((sum, b) => sum + parseFloat(b.allocated || 0), 0);
    const totalUsed = filteredBalances.reduce((sum, b) => sum + parseFloat(b.used || 0), 0);
    const totalRemaining = filteredBalances.reduce((sum, b) => sum + parseFloat(b.available || 0), 0);
    const avgUsage = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

    if (loading && balances.length === 0) {
        return (
            <div className="balance-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading leave balances...</p>
            </div>
        );
    }

    return (
        <div className="leave-balance">
            {/* Stats Dashboard */}
            <div className="balance-stats">
                <div className="balance-stat-card primary">
                    <div className="balance-stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="balance-stat-info">
                        <span className="balance-stat-label">Total Allocated</span>
                        <span className="balance-stat-value">{totalAllocated.toFixed(1)} Days</span>
                    </div>
                </div>

                <div className="balance-stat-card success">
                    <div className="balance-stat-icon">
                        <CheckCircle size={24} />
                    </div>
                    <div className="balance-stat-info">
                        <span className="balance-stat-label">Total Used</span>
                        <span className="balance-stat-value">{totalUsed.toFixed(1)} Days</span>
                    </div>
                </div>

                <div className="balance-stat-card warning">
                    <div className="balance-stat-icon">
                        <Clock size={24} />
                    </div>
                    <div className="balance-stat-info">
                        <span className="balance-stat-label">Average Usage</span>
                        <span className="balance-stat-value">{avgUsage.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="balance-stat-card info">
                    <div className="balance-stat-icon">
                        <Users size={24} />
                    </div>
                    <div className="balance-stat-info">
                        <span className="balance-stat-label">Employees Tracked</span>
                        <span className="balance-stat-value">{new Set(balances.map(b => b.employee)).size}</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="balance-toolbar">
                <div className="balance-toolbar-left">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Find employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="year-selector">
                        <Calendar size={18} />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y} Fiscal Year</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="balance-toolbar-right">
                    <button
                        className="btn btn-secondary"
                        onClick={handleBulkAllocate}
                        disabled={isAllocating}
                    >
                        {isAllocating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                        Bulk Allocate
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleRunAccrual}
                        disabled={isAllocating}
                        style={{ border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}
                    >
                        {isAllocating ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                        Run Accrual
                    </button>
                    <button className="btn btn-primary">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="balance-table-container">
                {filteredBalances.length === 0 ? (
                    <div className="balance-empty">
                        <AlertCircle size={48} />
                        <p>No balance records found for {selectedYear}.</p>
                        <button className="btn btn-primary" onClick={handleBulkAllocate}>
                            Run Allocation Now
                        </button>
                    </div>
                ) : (
                    <table className="balance-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Leave Type</th>
                                <th>Year</th>
                                <th className="text-center">Allocated</th>
                                <th className="text-center">Used</th>
                                <th className="text-center">Pending</th>
                                <th className="text-center">Available</th>
                                <th>Usage Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBalances.map((b) => {
                                const usagePercent = b.allocated > 0 ? (b.used / (parseFloat(b.allocated) + parseFloat(b.carry_forward || 0))) * 100 : 0;
                                const totalQuota = parseFloat(b.allocated) + parseFloat(b.carry_forward || 0);

                                return (
                                    <tr key={b.id}>
                                        <td>
                                            <div className="emp-pill">
                                                <div className="emp-avatar">
                                                    {(b.employee_name || 'E')[0]}
                                                </div>
                                                <div className="emp-info">
                                                    <span className="emp-name">{b.employee_name}</span>
                                                    <span className="emp-id">{b.employee_id_display}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="leave-type-badge">{b.leave_type_name}</span>
                                        </td>
                                        <td>{b.year}</td>
                                        <td className="text-center font-medium">{totalQuota}</td>
                                        <td className="text-center text-success font-medium">{b.used}</td>
                                        <td className="text-center text-warning font-medium">{b.pending}</td>
                                        <td className="text-center font-bold">{b.available}</td>
                                        <td>
                                            <div className="usage-progress-container">
                                                <div className="usage-progress-track">
                                                    <div
                                                        className={`usage-progress-bar ${usagePercent > 80 ? 'danger' : usagePercent > 50 ? 'warning' : 'success'}`}
                                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="usage-text">{Math.round(usagePercent)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
