import { Clock, Users, ArrowDown, ArrowUp, AlertTriangle, AlertCircle } from 'lucide-react';
import './LateEarlyAnalysis.css';

const mockLateComers = [
    { id: 1, name: 'Amit Patel', empId: 'PEP10', date: '2026-01-19', status: 'Late', delay: '15 mins', policy: 'Standard Morning' },
    { id: 2, name: 'Priya Sharma', empId: 'PEP07', date: '2026-01-19', status: 'Late', delay: '45 mins', policy: 'Standard Morning' },
    { id: 3, name: 'Vikram Singh', empId: 'PEP09', date: '2026-01-18', status: 'Early Out', delay: '30 mins', policy: 'Standard Evening' },
    { id: 4, name: 'Kiran Kishor', empId: 'PEP00', date: '2026-01-20', status: 'Late', delay: '02 hours', policy: 'Shift A' },
    { id: 5, name: 'Afsal', empId: 'PEP01', date: '2026-01-20', status: 'Early Out', delay: '10 mins', policy: 'Shift B' },
];

export default function LateEarlyAnalysis() {
    const getSeverityClass = (status, delay) => {
        if (status === 'Early Out') return 'early';
        if (delay.includes('hour')) return 'late-Major';
        return 'late-minor';
    };

    return (
        <div className="late-early-analysis-section">
            <div className="lea-stats-grid">
                {/* Stat Card 1 */}
                <div className="lea-stat-card">
                    <div className="lea-card-header">
                        <div className="lea-icon-wrapper rose">
                            <Clock size={24} />
                        </div>
                        <span className="lea-badge rose">This Week</span>
                    </div>
                    <div className="lea-stat-value">12.5m</div>
                    <div className="lea-stat-label">Avg. Late Arrival</div>
                    <div className="lea-trend down">
                        <ArrowDown size={14} /> 2.1% vs last week
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="lea-stat-card">
                    <div className="lea-card-header">
                        <div className="lea-icon-wrapper amber">
                            <Users size={24} />
                        </div>
                        <span className="lea-badge amber">Today</span>
                    </div>
                    <div className="lea-stat-value">8</div>
                    <div className="lea-stat-label">Frequent Late Comers</div>
                    <div className="lea-trend up">
                        <ArrowUp size={14} /> 4 New Employees
                    </div>
                </div>
            </div>

            <div className="lea-table-container">
                <div className="lea-header-area">
                    <h3 className="lea-title">Late / Early Out Exceptions</h3>
                    <button className="wr-export-btn text-xs py-2">Export Report</button>
                </div>
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
                        {mockLateComers.map(row => (
                            <tr key={row.id}>
                                <td>
                                    <div className="lea-avatar-cell">
                                        <div className="lea-avatar">{row.name.charAt(0)}</div>
                                        <div>
                                            <div className="font-semibold text-sm">{row.name}</div>
                                            <div className="text-xs text-muted">{row.empId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{row.date}</td>
                                <td>
                                    <span className={`severity-badge ${getSeverityClass(row.status, row.delay)}`}>
                                        {row.status === 'Early Out' ? <AlertCircle size={12} /> : <AlertTriangle size={12} />}
                                        {row.status}
                                    </span>
                                </td>
                                <td className="deviation-time">{row.delay}</td>
                                <td className="text-muted text-sm italic">{row.policy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
