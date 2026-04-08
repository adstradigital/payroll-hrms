import React from 'react';
import { Building2, Users, CreditCard, ChevronRight, Zap, Target, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import './Organizations.css';

const MeshBackground = () => (
    <div className="mesh-container">
        <div className="mesh-ball mesh-ball-1"></div>
        <div className="mesh-ball mesh-ball-2"></div>
        <div className="mesh-ball mesh-ball-3"></div>
    </div>
);

const ORG_DATA = [
    { id: 1, name: "Acme Corporation", employees: 1240, plan: "Enterprise", status: "Active", revenue: "$12,450/mo", domain: "acme.com" },
    { id: 2, name: "Cyberdyne Systems", employees: 850, plan: "Pro", status: "Active", revenue: "$8,500/mo", domain: "cyberdyne.io" },
    { id: 3, name: "Initech", employees: 45, plan: "Starter", status: "Pending", revenue: "$450/mo", domain: "initech.com" },
    { id: 4, name: "Massive Dynamic", employees: 12000, plan: "Enterprise", status: "Active", revenue: "$120,000/mo", domain: "massive.dyn" },
];

const StatusBadge = ({ status }) => {
    const isPending = status.toLowerCase() === 'pending';
    return (
        <span className={`org-status-badge ${isPending ? 'pending' : 'active'}`}>
            <span className="dot"></span>
            {status}
        </span>
    );
};

const Organizations = () => {
    const { user } = useAuth();
    
    return (
        <div className="orgs-wrapper animate-slide-up">
            <MeshBackground />
            
            <div className="orgs-header-premium">
                <div className="header-badge">
                    <Target size={12} className="text-indigo-400" />
                    <span>Registry Overview</span>
                </div>
                <div className="header-info-flex">
                    <div>
                        <h1 className="orgs-title-premium">Client <span className="text-gradient">Organizations</span></h1>
                        <p className="orgs-subtitle-premium">
                            Master directory of <strong>{ORG_DATA.length}</strong> active client entities across the global network.
                        </p>
                    </div>
                    <button className="premium-btn-primary">
                        <span>+ Add Organization</span>
                    </button>
                </div>
            </div>

            <div className="orgs-grid-premium">
                {ORG_DATA.map((org) => (
                    <div key={org.id} className="org-card-nexus group">
                        <div className="card-glass-shine"></div>
                        <div className="card-top-flex">
                            <div className="org-avatar-nexus">
                                {org.name.charAt(0)}
                            </div>
                            <StatusBadge status={org.status} />
                        </div>

                        <div className="org-info-middle">
                            <h3 className="org-name-nexus">{org.name}</h3>
                            <div className="org-domain">
                                <Globe size={14} />
                                <span>{org.domain}</span>
                            </div>
                        </div>

                        <div className="org-metrics-nexus">
                            <div className="metric-item">
                                <div className="metric-label">Force</div>
                                <div className="metric-value-flex">
                                    <Users size={14} />
                                    <span>{org.employees.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-label">Yield</div>
                                <div className="metric-value-flex text-emerald-400">
                                    <span>{org.revenue}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer-nexus">
                            <div className="plan-tag">
                                <Zap size={12} />
                                {org.plan}
                            </div>
                            <button className="nexus-view-btn">
                                <span>Analyze</span>
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
