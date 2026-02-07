'use client';

import { useState, useEffect } from 'react';
import {
    Loader,
    Clock,
    LogIn,
    LogOut,
    History,
    CheckCircle2,
    AlertCircle,
    LayoutDashboard,
    Wallet,
    MoreVertical,
    Calendar as CalendarIcon,
    TrendingUp,
    ShieldAlert,
    Download,
    Briefcase as BriefcaseIcon,
    Plus,
    X,
    FileText,
    Coffee
} from 'lucide-react';
import { getLeaveTypes } from '@/api/api_clientadmin';
import ApplyLeaveModal from '@/components/ClientAdmin/Payroll/Leave/LeaveList/ApplyLeaveModal';
import './MyAttendance.css';

export default function MyAttendance() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);

    // Clock Out Modal States
    const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
    const [showWorkReportModal, setShowWorkReportModal] = useState(false);
    const [workReport, setWorkReport] = useState({ tasks: '', notes: '' });


    // Regularization Modal States
    const [regularizeModalOpen, setRegularizeModalOpen] = useState(false);
    const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);
    const [regularizeData, setRegularizeData] = useState({ check_out_time: '', reason: '' });
    const [submittingRegularization, setSubmittingRegularization] = useState(false);
    const [submittingReport, setSubmittingReport] = useState(false);

    // Timer for clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const month = currentTime.getMonth() + 1;
            const year = currentTime.getFullYear();

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            let url = `${baseUrl}/attendance/my_dashboard/?month=${month}&year=${year}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const dashboardData = await response.json();

                // Transform API data to match new UI structure
                setData({
                    employee: {
                        name: dashboardData.employee?.name || 'Employee',
                        role: dashboardData.employee?.role || 'Team Member',
                        id: dashboardData.employee?.id
                    },
                    today: {
                        check_in: dashboardData.today?.check_in ? new Date(dashboardData.today.check_in) : null,
                        check_out: dashboardData.today?.check_out ? new Date(dashboardData.today.check_out) : null,
                        status: dashboardData.today?.status, // 'PRESENT', 'LATE', etc.
                        is_on_break: dashboardData.today?.is_on_break || false,
                        break_hours: dashboardData.today?.break_hours || 0,
                        is_late: dashboardData.today?.is_late || false,
                        is_early_departure: dashboardData.today?.is_early_departure || false,
                        shift: dashboardData.today?.shift || null
                    },
                    stats: {
                        present: dashboardData.stats?.present || 0,
                        absent: dashboardData.stats?.absent || 0,
                        late: dashboardData.stats?.late || 0,
                        early_going: dashboardData.stats?.early_going || 0,
                        leaves: dashboardData.stats?.on_leave || 0,
                        half_day: dashboardData.stats?.half_day || 0,
                        total_hours: dashboardData.stats?.total_hours || 0,
                        attendance_score: calculateAttendanceScore(dashboardData.stats)
                    },
                    // Real Balances & Payroll from API
                    balances: {
                        casual: dashboardData.balances?.find(b => b.type.toLowerCase().includes('casual'))?.available || 0,
                        sick: dashboardData.balances?.find(b => b.type.toLowerCase().includes('sick'))?.available || 0,
                        privilege: dashboardData.balances?.find(b => b.type.toLowerCase().includes('privilege') || b.type.toLowerCase().includes('earned'))?.available || 0,
                        raw: dashboardData.balances || []
                    },
                    payroll: {
                        base_salary: dashboardData.payroll?.gross || 0,
                        currency: '₹',
                        net: dashboardData.payroll?.net || 0,
                        deductions_total: dashboardData.payroll?.deductions || 0,
                        lop_deduction: dashboardData.payroll?.lop_deduction || 0
                    },
                    history: dashboardData.recent_logs?.map((log, idx) => {
                        let hours = log.total_hours || '0.00';
                        // Validation: Prevent negative hours display
                        if (parseFloat(hours) < 0) {
                            hours = '0.00';
                        }
                        return {
                            id: log.id || idx,
                            date: new Date(log.date).toLocaleDateString(),
                            status: log.status?.toUpperCase() || '-',
                            in: log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                            out: log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                            hours: hours,
                            isLate: log.is_late
                        };
                    }) || [],
                    settings: dashboardData.settings || { track_break_time: true, enable_shift_system: true }
                });
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateAttendanceScore = (stats) => {
        if (!stats) return 100;

        // Count total working days (present + absent + late + half_day)
        const totalDays = (stats.present || 0) + (stats.absent || 0) + (stats.half_day || 0);
        if (totalDays === 0) return 100; // No data yet, assume perfect

        // Calculate effective present days
        // Full present = 1 point, Half day = 0.5 points, Late/Early reduces by 0.1 each
        const presentDays = stats.present || 0;
        const halfDays = (stats.half_day || 0) * 0.5;
        const latePenalty = (stats.late || 0) * 0.1;
        const earlyGoingPenalty = (stats.early_going || 0) * 0.1;

        const effectivePresent = presentDays + halfDays - latePenalty - earlyGoingPenalty;
        const score = Math.round((effectivePresent / totalDays) * 100);

        return Math.max(0, Math.min(100, score));
    };

    const getHealthMessage = (score) => {
        if (score >= 95) return { text: 'Excellent! You have near-perfect attendance.', icon: 'success' };
        if (score >= 85) return { text: 'Great job! You\'re maintaining good attendance.', icon: 'success' };
        if (score >= 70) return { text: 'Good effort. A few improvements can boost your score.', icon: 'warning' };
        if (score >= 50) return { text: 'Needs improvement. Try to reduce absences and late arrivals.', icon: 'warning' };
        return { text: 'Critical! Your attendance needs immediate attention.', icon: 'danger' };
    };


    // Fetch leave types for apply leave modal
    const fetchLeaveTypes = async () => {
        try {
            const res = await getLeaveTypes();
            const types = res.data.results || (Array.isArray(res.data) ? res.data : []);
            setLeaveTypes(types);
        } catch (err) {
            console.error('Error fetching leave types:', err);
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchLeaveTypes();

        const handleAttendanceUpdate = () => {
            fetchDashboard();
        };

        window.addEventListener('attendance-updated', handleAttendanceUpdate);
        return () => window.removeEventListener('attendance-updated', handleAttendanceUpdate);
    }, []); // Only fetch once on mount (or when needed)


    const handleStartBreak = async () => {
        if (!data?.employee?.id) return;
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/start_break/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employee: data.employee.id, break_type: 'lunch' })
            });

            if (response.ok) {
                await fetchDashboard();
                window.dispatchEvent(new Event('attendance-updated'));
            }
        } catch (err) {
            console.error('Error starting break:', err);
        }
    };

    const handleEndBreak = async () => {
        if (!data?.employee?.id) return;
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/end_break/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employee: data.employee.id })
            });

            if (response.ok) {
                await fetchDashboard();
                window.dispatchEvent(new Event('attendance-updated'));
            }
        } catch (err) {
            console.error('Error ending break:', err);
        }
    };

    const handleClockIn = async () => {
        if (!data?.employee?.id) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/check-in/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employee: data.employee.id })
            });

            if (response.ok) {
                await fetchDashboard();
                window.dispatchEvent(new Event('attendance-updated'));
            }
        } catch (err) {
            console.error('Error clocking in:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Show confirmation modal when clock out button is clicked
    const handleClockOutClick = () => {
        setShowClockOutConfirm(true);
    };

    // Step 2: After confirmation, show work report modal
    const handleConfirmClockOut = () => {
        setShowClockOutConfirm(false);
        setShowWorkReportModal(true);
    };

    // --- REGULARIZATION HANDLERS ---
    const handleOpenRegularize = (id) => {
        setSelectedAttendanceId(id);
        setRegularizeData({ check_out_time: '', reason: '' });
        setRegularizeModalOpen(true);
    };

    const submitRegularization = async () => {
        if (!selectedAttendanceId || !regularizeData.check_out_time || !regularizeData.reason) return;
        setSubmittingRegularization(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/${selectedAttendanceId}/regularize/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(regularizeData)
            });

            if (response.ok) {
                setRegularizeModalOpen(false);
                setRegularizeData({ check_out_time: '', reason: '' });
                await fetchDashboard();
                window.dispatchEvent(new Event('attendance-updated'));
            } else {
                const errorData = await response.json();
                console.error('Regularization failed:', errorData);
                // Optionally show error to user
            }
        } catch (err) {
            console.error('Error submitting regularization:', err);
        } finally {
            setSubmittingRegularization(false);
        }
    };

    // Step 3: Submit work report and then clock out
    const handleSubmitWorkReport = async () => {
        if (!workReport.tasks.trim()) {
            return; // Don't allow empty report
        }

        if (!data?.employee?.id) return;
        setSubmittingReport(true);

        try {
            const token = localStorage.getItem('accessToken');

            // First, submit the work report (you can add a backend endpoint for this)
            // For now, we'll include it in the clock-out request or store locally

            // Clock out
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/check-out/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee: data.employee.id,
                    work_report: {
                        tasks_completed: workReport.tasks,
                        notes: workReport.notes
                    }
                })
            });

            if (response.ok) {
                setShowWorkReportModal(false);
                setWorkReport({ tasks: '', notes: '' });
                await fetchDashboard();
                window.dispatchEvent(new Event('attendance-updated'));
            }
        } catch (err) {
            console.error('Error clocking out:', err);
        } finally {
            setSubmittingReport(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="my-attendance flex-center" style={{ flexDirection: 'column', height: '100vh', justifyContent: 'center' }}>
                <Loader className="animate-spin" color="var(--brand-primary)" size={48} />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Portal...</p>
            </div>
        );
    }

    if (!data) return <div className="my-attendance">Failed to load data.</div>;

    // Simplified Deductions from backend
    const totalDeductions = data.payroll.deductions_total;
    const projectedSalary = data.payroll.net;
    const lopDeduction = data.payroll.lop_deduction;

    return (
        <div className="my-attendance">

            {/* --- Top Navigation --- */}


            <div className="container">

                {/* --- Tab Control --- */}
                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <LayoutDashboard size={18} /> My Attendance
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                        onClick={() => setActiveTab('leaves')}
                    >
                        <Wallet size={18} /> Leaves & Payroll
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History size={18} /> History
                    </button>
                </div>

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">
                        <div className="hero-grid">
                            {/* Welcome & Clock Card */}
                            <div className="welcome-box">
                                <div>
                                    <div className="date-badge">
                                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: '1rem', opacity: 0.9 }}>Good Morning, {data.employee.name.split(' ')[0]}</div>
                                    <div className="clock-huge">
                                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {data.today.shift && (
                                        <div className="shift-badge" style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginTop: '0.5rem'
                                        }}>
                                            <Clock size={14} />
                                            <span>Shift: {data.today.shift.name} ({data.today.shift.start_time} - {data.today.shift.end_time})</span>
                                        </div>
                                    )}
                                </div>

                                {!data.today.check_in ? (
                                    <button className="btn btn-white" onClick={handleClockIn}>
                                        <LogIn size={18} /> Clock In Now
                                    </button>
                                ) : !data.today.check_out ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button className="btn btn-outline-white" onClick={handleClockOutClick}>
                                            <LogOut size={18} /> Clock Out
                                        </button>
                                        {data.settings?.track_break_time && (
                                            !data.today.is_on_break ? (
                                                <button className="btn btn-white" onClick={handleStartBreak}>
                                                    <Coffee size={18} /> Start Break
                                                </button>
                                            ) : (
                                                <button className="btn btn-white" onClick={handleEndBreak} style={{ background: 'var(--color-warning)', color: 'white', border: 'none' }}>
                                                    <CheckCircle2 size={18} /> End Break
                                                </button>
                                            )
                                        )}
                                        {data.today.shift && !data.today.check_out && (
                                            <div style={{ fontSize: '0.75rem', opacity: 0.8, width: '100%', marginTop: '0.25rem' }}>
                                                Target: {data.today.shift.end_time}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="btn btn-outline-white" style={{ cursor: 'default' }}>
                                        <CheckCircle2 size={18} /> Shift Completed
                                    </div>
                                )}
                            </div>

                            {/* Attendance Score Card */}
                            <div className="score-box">
                                <div className="progress-header">
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Attendance Health</span>
                                    <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{data.stats.attendance_score}%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-bar" style={{ width: `${data.stats.attendance_score}%` }}></div>
                                </div>
                                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    <TrendingUp
                                        size={14}
                                        style={{ display: 'inline', marginRight: 4 }}
                                        color={getHealthMessage(data.stats.attendance_score).icon === 'success' ? 'var(--color-success)' :
                                            getHealthMessage(data.stats.attendance_score).icon === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)'}
                                    />
                                    {getHealthMessage(data.stats.attendance_score).text}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.stats.present}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Present</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.stats.absent}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Absent</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                                    <Clock size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.stats.late}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.stats.early_going || 0} EG</div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Late / Early</div>
                                </div>
                            </div>
                            {/* Leaves Taken - Using real data */}
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--brand-primary-light)', color: 'var(--brand-primary)' }}>
                                    <BriefcaseIcon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.stats.leaves}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Leaves Taken</div>
                                </div>
                            </div>
                            {/* Total Hours - Using real data */}
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                    <History size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{Number(data.stats.total_hours).toFixed(1)}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.today.break_hours?.toFixed(1) || 0}h Break</div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total / Break Hours</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LEAVES & PAYROLL TAB --- */}
                {activeTab === 'leaves' && (
                    <div className="animate-fade-in">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingRight: '4rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Leave Balances</h3>
                            <button
                                className="btn btn-primary"
                                onClick={() => setLeaveModalOpen(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Plus size={18} /> Apply Leave
                            </button>
                        </div>
                        <div className="balances-row">
                            <div className="balance-card bc-casual">
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.balances.casual}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Casual</div>
                            </div>
                            <div className="balance-card bc-sick">
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.balances.sick}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sick</div>
                            </div>
                            <div className="balance-card bc-priv">
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.balances.privilege}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Earned/Privilege</div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title flex-center" style={{ gap: '0.5rem' }}>
                                    <Wallet size={20} color="var(--brand-primary)" /> Payroll Estimate (Month-to-Date)
                                </span>
                                <span className="badge badge-late">Draft</span>
                            </div>
                            <div className="card-body">
                                <div className="payslip-preview">
                                    <div className="deductions-list">
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Projected Adjustments</h4>

                                        <div className="deduction-item">
                                            <span>Attendance LOP ({data.stats.absent}A, {data.stats.half_day}H)</span>
                                            <span className="text-danger font-mono">- {data.payroll.currency}{lopDeduction}</span>
                                        </div>
                                        <div className="deduction-item">
                                            <span>Statutory/Other Deductions</span>
                                            <span className="text-danger font-mono">- {data.payroll.currency}{(data.payroll.deductions_total - lopDeduction).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="total-est-box">
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Estimated Net Payout</span>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-primary)', margin: '0.5rem 0' }}>
                                            {data.payroll.currency}{projectedSalary}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Base: {data.payroll.currency}{data.payroll.base_salary}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- HISTORY TAB --- */}
                {activeTab === 'history' && (
                    <div className="card animate-fade-in">
                        <div className="card-header">
                            <span className="card-title">Attendance Log</span>
                            <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                                <Download size={14} style={{ marginRight: 6 }} /> Export
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="clean-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Total Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.history.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontWeight: 500 }}>
                                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                                    <CalendarIcon size={14} color="var(--text-secondary)" /> {log.date}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span className={`badge badge-${log.status.toLowerCase()}`}>{log.status}</span>
                                                    {log.isLate && <span className="badge badge-late">LATE</span>}
                                                </div>
                                            </td>
                                            <td className="font-mono">{log.in}</td>
                                            <td className="font-mono">{log.out}</td>
                                            <td style={{ fontWeight: 600 }}>
                                                {log.out === '-' && log.in !== '-' ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleOpenRegularize(log.id)}
                                                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', height: 'auto' }}
                                                    >
                                                        Regularize
                                                    </button>
                                                ) : log.hours}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* Apply Leave Modal */}
            <ApplyLeaveModal
                isOpen={leaveModalOpen}
                onClose={() => setLeaveModalOpen(false)}
                currentUser={{ id: data?.employee?.id, name: data?.employee?.name }}
                leaveTypes={leaveTypes}
                onSuccess={() => {
                    setLeaveModalOpen(false);
                    fetchDashboard();
                }}
            />

            {/* Clock Out Confirmation Modal */}
            {
                showClockOutConfirm && (
                    <div className="modal-overlay" onClick={() => setShowClockOutConfirm(false)}>
                        <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3><Clock size={20} /> End Your Shift</h3>
                                <button className="modal-close" onClick={() => setShowClockOutConfirm(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-icon-wrapper">
                                    <LogOut size={48} />
                                </div>
                                <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                    <strong>Are you sure you want to clock out?</strong>
                                </p>
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    This will mark your shift as complete for today. You will need to submit a work report before clocking out.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowClockOutConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleConfirmClockOut}
                                >
                                    Yes, Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Work Report Modal */}
            {
                showWorkReportModal && (
                    <div className="modal-overlay">
                        <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3><FileText size={20} /> Daily Work Report</h3>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                    Please submit your work report before clocking out. This is required.
                                </p>

                                <div className="form-group">
                                    <label htmlFor="tasks">
                                        Tasks Completed Today <span style={{ color: 'var(--color-danger)' }}>*</span>
                                    </label>
                                    <textarea
                                        id="tasks"
                                        rows={4}
                                        placeholder="List the tasks you completed today..."
                                        value={workReport.tasks}
                                        onChange={(e) => setWorkReport(prev => ({ ...prev, tasks: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="notes">Additional Notes (Optional)</label>
                                    <textarea
                                        id="notes"
                                        rows={2}
                                        placeholder="Any blockers, issues, or notes for tomorrow..."
                                        value={workReport.notes}
                                        onChange={(e) => setWorkReport(prev => ({ ...prev, notes: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowWorkReportModal(false);
                                        setWorkReport({ tasks: '', notes: '' });
                                    }}
                                    disabled={submittingReport}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmitWorkReport}
                                    disabled={!workReport.tasks.trim() || submittingReport}
                                >
                                    {submittingReport ? (
                                        <>
                                            <Loader size={16} className="animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} /> Submit & Clock Out
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Regularization Modal */}
            {
                regularizeModalOpen && (
                    <div className="modal-overlay" onClick={() => setRegularizeModalOpen(false)}>
                        <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3><Clock size={20} /> Regularize Attendance</h3>
                                <button className="modal-close" onClick={() => setRegularizeModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Missed a clock-out? Enter the time you left work.
                                </p>

                                <div className="form-group">
                                    <label>Actual Check Out Time <span className="text-danger">*</span></label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        value={regularizeData.check_out_time}
                                        onChange={(e) => setRegularizeData(prev => ({ ...prev, check_out_time: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label>Reason <span className="text-danger">*</span></label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Forgot to clock out, Battery died..."
                                        value={regularizeData.reason}
                                        onChange={(e) => setRegularizeData(prev => ({ ...prev, reason: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setRegularizeModalOpen(false)}
                                    disabled={submittingRegularization}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={submitRegularization}
                                    disabled={!regularizeData.check_out_time || !regularizeData.reason || submittingRegularization}
                                >
                                    {submittingRegularization ? 'Saving...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}