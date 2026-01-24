import React, { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    Lock,
    Search,
    Filter,
    MoreHorizontal,
    ShieldCheck,
    Globe,
    Smartphone,
    Download,
    MapPin
} from 'lucide-react';
import { getAllUsers } from '@/api/api_superadmin';
import './LoginManagement.css';

const StatusBadge = ({ status }) => {
    const styles = {
        success: "status-badge-green",
        failed: "status-badge-red",
        pending: "status-badge-amber",
        active: "status-badge-blue",
    };

    const label = status.charAt(0).toUpperCase() + status.slice(1);
    const style = styles[status.toLowerCase()] || styles.active;

    return (
        <span className={`status-badge ${style}`}>
            {label}
        </span>
    );
};

const LoginManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await getAllUsers();
            setUsers(res.data.results || res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const stats = [
        { label: "Active Sessions", value: "1,248", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500-10" },
        { label: "Failed Attempts (24h)", value: "23", icon: Lock, color: "text-red-400", bg: "bg-red-500-10" },
        { label: "MFA Usage", value: "94%", icon: Smartphone, color: "text-blue-400", bg: "bg-blue-500-10" },
        { label: "Avg. Session Time", value: "48m", icon: Activity, color: "text-amber-400", bg: "bg-amber-500-10" },
    ];

    return (
        <div className="login-mgmt-wrapper animate-slide-up">
            <div className="page-header-flex">
                <div>
                    <h1 className="page-heading">Login Audit & Security</h1>
                    <p className="page-subheading">Monitor system access events, active sessions, and security anomalies across all organizations.</p>
                </div>
                <div className="header-button-group">
                    <button className="btn-secondary">
                        <Filter size={16} />
                        <span>Filter</span>
                    </button>
                    <button className="btn-premium">
                        <Download size={16} />
                        <span>Export Logs</span>
                    </button>
                </div>
            </div>

            {/* Security Metrics */}
            <div className="metrics-grid">
                {stats.map((stat, idx) => (
                    <div key={idx} className="metric-card">
                        <div className="metric-info">
                            <span className="metric-label">{stat.label}</span>
                            <h3 className="metric-value">{stat.value}</h3>
                        </div>
                        <div className={`metric-icon-bg ${stat.bg}`}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Audit Table */}
            <div className="table-card-premium">
                <div className="table-header-flex">
                    <h3 className="table-title">Recent Authentication Events</h3>
                    <button className="link-btn">View All Events</button>
                </div>

                <div className="table-container-scroll">
                    <table className="nexus-table">
                        <thead>
                            <tr>
                                <th>User / Email</th>
                                <th>Organization</th>
                                <th>Details</th>
                                <th>Location/IP</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8">Loading events...</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="nexus-row">
                                        <td>
                                            <div className="user-profile-cell">
                                                <div className="user-avatar-sm">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div className="user-meta">
                                                    <div className="user-name-text">{user.name || 'Unknown'}</div>
                                                    <div className="user-email-text">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="org-cell">
                                                <span className="org-name-text">{user.is_superuser ? 'Global' : 'Acme Corp'}</span>
                                                <div className="user-role-text">{user.is_superuser ? 'Super Admin' : 'Admin'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="details-cell">
                                                <div className="device-info">
                                                    <Smartphone size={12} />
                                                    <span>MacBook Pro</span>
                                                </div>
                                                <div className="time-info">{user.last_login ? new Date(user.last_login).toLocaleTimeString() : 'Never'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="location-cell">
                                                <div className="geo-info">
                                                    <MapPin size={12} />
                                                    <span>San Francisco, US</span>
                                                </div>
                                                <div className="ip-info">192.168.1.10</div>
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={user.is_active ? 'success' : 'failed'} />
                                        </td>
                                        <td className="text-right">
                                            <button className="action-dots-btn">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer-flex">
                    <span className="footer-text">Showing {users.length} of {users.length * 10} events</span>
                    <div className="pagination-btns">
                        <button className="btn-pagination">Previous</button>
                        <button className="btn-pagination">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginManagement;
