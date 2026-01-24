import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Calendar as CalendarIcon, Filter, Download } from 'lucide-react';
import './LateEarlyRules.css';

export default function LateEarlyRules() {
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());

    const fetchExceptions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const month = viewDate.getMonth() + 1;
            const year = viewDate.getFullYear();

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/attendance/exceptions_report/?month=${month}&year=${year}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setExceptions(data.results || []);
            } else {
                console.error('Failed to fetch exceptions');
            }
        } catch (error) {
            console.error('Error fetching exceptions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExceptions();
    }, [viewDate]);

    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-');
        setViewDate(new Date(year, month - 1));
    };

    const getSeverityClass = (status, delay) => {
        if (status.includes('Early')) return 'early';
        if (delay.includes('h')) return 'late-Major'; // Heuristic for major delay if it contains 'h' (hours)
        return 'late-minor';
    };

    return (
        <div className="late-early-rules-section">
            <div className="lea-table-container">
                <div className="lea-header-area">
                    <div className="lea-title-block">
                        <h3 className="lea-title">Late / Early Out Exceptions</h3>
                        <p className="lea-subtitle">Monitor attendance deviations for {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="lea-actions">
                        <div className="wr-month-picker" style={{ marginRight: '1rem' }}>
                            <label>Period</label>
                            <input
                                type="month"
                                className="wr-month-input"
                                value={`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`}
                                onChange={handleMonthChange}
                            />
                        </div>
                        <button className="wr-export-btn">
                            <Download size={16} /> Export Report
                        </button>
                    </div>
                </div>

                <div className="lea-table-responsive">
                    <table className="lea-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Exception Type</th>
                                <th>Deviation</th>
                                <th>Policy Applied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-4">Loading report...</td></tr>
                            ) : exceptions.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-4">No late/early exceptions found for this month</td></tr>
                            ) : (
                                exceptions.map(row => (
                                    <tr key={row.id}>
                                        <td>
                                            <div className="lea-avatar-cell">
                                                <div className="lea-avatar">{row.name.charAt(0)}</div>
                                                <div>
                                                    <div className="lea-employee-name">{row.name}</div>
                                                    <div className="lea-employee-id">{row.empId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{row.date}</td>
                                        <td>
                                            <span className={`severity-badge ${getSeverityClass(row.status, row.delay)}`}>
                                                {row.status.includes('Early') ? <AlertCircle size={12} /> : <AlertTriangle size={12} />}
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="deviation-time">{row.delay}</td>
                                        <td className="lea-policy-text">{row.policy}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
