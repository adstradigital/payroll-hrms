import React from 'react';
import { Building2, Users, CreditCard, ChevronRight } from 'lucide-react';
import './Organizations.css';

const ORG_DATA = [
    { id: 1, name: "Acme Corporation", employees: 1240, plan: "Enterprise", status: "Active", revenue: "$12,450/mo" },
    { id: 2, name: "Cyberdyne Systems", employees: 850, plan: "Pro", status: "Active", revenue: "$8,500/mo" },
    { id: 3, name: "Initech", employees: 45, plan: "Starter", status: "Pending", revenue: "$450/mo" },
    { id: 4, name: "Massive Dynamic", employees: 12000, plan: "Enterprise", status: "Active", revenue: "$120,000/mo" },
];

const StatusBadge = ({ status }) => {
    const styles = {
        active: "org-status-active",
        pending: "org-status-pending",
    };
    const style = styles[status.toLowerCase()] || styles.active;
    return <span className={`org-status-badge ${style}`}>{status}</span>;
};

const Organizations = () => {
    return (
        <div className="orgs-wrapper animate-slide-up">
            <div className="orgs-header">
                <div>
                    <h1 className="orgs-title">Client Organizations</h1>
                    <p className="orgs-subtitle">Global registry of all organizations and client entities managed by the system.</p>
                </div>
                <button className="btn-primary-nexus">
                    + Add Organization
                </button>
            </div>

            <div className="orgs-grid">
                {ORG_DATA.map((org) => (
                    <div key={org.id} className="org-card-premium group">
                        <div className="card-top-flex">
                            <div className="org-avatar-large">
                                {org.name.charAt(0)}
                            </div>
                            <StatusBadge status={org.status} />
                        </div>

                        <div className="org-info-middle">
                            <h3 className="org-name-heading group-hover-amber">{org.name}</h3>
                            <div className="plan-badge-row">
                                <CreditCard size={14} />
                                <span>{org.plan} Plan</span>
                            </div>
                        </div>

                        <div className="org-metrics-row">
                            <div className="metric-box">
                                <span className="metric-box-label">Employees</span>
                                <div className="metric-box-flex">
                                    <Users size={14} className="text-zinc-500" />
                                    <span className="metric-box-value">{org.employees.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="metric-box text-right-align">
                                <span className="metric-box-label">Monthly Revenue</span>
                                <div className="metric-box-flex justify-end">
                                    <span className="metric-box-value text-emerald-400">{org.revenue}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer-action">
                            <button className="btn-view-details">
                                View Details
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Organizations;
