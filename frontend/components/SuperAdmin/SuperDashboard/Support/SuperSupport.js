'use client';

import { useState, useEffect } from 'react';
import { 
    Search, 
    MessageSquare, 
    Filter, 
    ChevronRight, 
    Clock, 
    AlertCircle,
    CheckCircle2,
    Inbox,
    Building2,
    User as UserIcon,
    ArrowUpRight,
    X,
    Send,
    Terminal,
    Shield,
    Calendar,
    Activity
} from 'lucide-react';
import * as supportApi from '@/api/supportApi';
import './SuperSupport.css';

export default function SuperSupport() {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Deep Dive State
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [solutionText, setSolutionText] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeStatus, searchQuery]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (activeStatus !== 'all') filters.status = activeStatus;
            if (searchQuery) filters.search = searchQuery;

            const [ticketsData, statsData] = await Promise.all([
                supportApi.getAllTickets(filters),
                supportApi.getTicketStats(),
            ]);

            setTickets(ticketsData.results || ticketsData);
            setStats(statsData);
        } catch (err) {
            setError('Failed to load platform tickets');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!solutionText.trim()) return;
        try {
            setIsResolving(true);
            await supportApi.resolveTicket(selectedTicket.id, solutionText);
            
            // Refresh local state
            setSelectedTicket(prev => ({ 
                ...prev, 
                status: 'resolved', 
                solution: solutionText 
            }));
            setSolutionText('');
            fetchData();
        } catch (err) {
            console.error('Resolution failed:', err);
        } finally {
            setIsResolving(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'open': return <Inbox size={16} />;
            case 'in_progress': return <Clock size={16} />;
            case 'resolved': return <CheckCircle2 size={16} />;
            case 'closed': return <AlertCircle size={16} />;
            default: return <MessageSquare size={16} />;
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'var(--sentinel-success)',
            medium: 'var(--sentinel-neon)',
            high: 'var(--sentinel-alert)',
            urgent: 'var(--sentinel-danger)'
        };
        return colors[priority] || 'var(--sentinel-sub)';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOrgInitials = (name) => {
        if (!name || name === 'N/A') return 'SYS';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="super-support-nexus">
            {/* Sentinel Header */}
            <div className="support-header">
                <div className="header-info">
                    <h1>Sentinel Command Center</h1>
                    <p>Global monitoring node active. Synchronizing organization vectors.</p>
                </div>
                
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card pending">
                            <span className="stat-value">{stats.open}</span>
                            <span className="stat-label">Pending Logs</span>
                        </div>
                        <div className="stat-card progress">
                            <span className="stat-value">{stats.in_progress}</span>
                            <span className="stat-label">Active Uplinks</span>
                        </div>
                        <div className="stat-card total">
                            <span className="stat-value">{stats.total}</span>
                            <span className="stat-label">Registry Total</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Unified Command Strip */}
            <div className="support-controls">
                <div className="search-box">
                    <Search size={18} color="var(--sentinel-cyan)" />
                    <input 
                        type="text" 
                        placeholder="Scan for identifiers, subjects, or organizational chips..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-tabs">
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                        <button
                            key={status}
                            className={`filter-tab ${activeStatus === status ? 'active' : ''}`}
                            onClick={() => setActiveStatus(status)}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sentinel Registry */}
            <div className="support-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="nexus-spinner"></div>
                        <p>Decrypting global data streams...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle2 size={64} color="var(--sentinel-success)" />
                        <h3>Sector Secured</h3>
                        <p>No anomalous activity detected within current parameters.</p>
                    </div>
                ) : (
                    <div className="ticket-list">
                        <div className="list-header">
                            <span className="col-ticket">Log Descriptor</span>
                            <span className="col-org">Origin Vector</span>
                            <span className="col-status">Heartbeat</span>
                            <span className="col-priority">Tier</span>
                            <span className="col-date">Terminal Stamp</span>
                            <span className="col-action">Focus</span>
                        </div>
                        
                        {tickets.map((ticket, index) => (
                            <div 
                                key={ticket.id} 
                                className="ticket-row"
                                onClick={() => setSelectedTicket(ticket)}
                            >
                                <div className="col-ticket">
                                    <span className="ticket-num">{ticket.ticket_number}</span>
                                    <span className="ticket-subject">{ticket.subject}</span>
                                </div>
                                
                                <div className="col-org">
                                    <div className="org-col-wrapper">
                                        <div className="org-avatar" style={{ background: 'var(--sentinel-cyan)' }}>
                                            {getOrgInitials(ticket.organization_name)}
                                        </div>
                                        <div className="org-details">
                                            <span>{ticket.organization_name || 'GLOBAL SYSTEM'}</span>
                                            <div className="user-info">{ticket.employee_name}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-status">
                                    <div className={`nexus-badge status-${ticket.status}`}>
                                        <div className="status-orb" />
                                        <span>{ticket.status.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="col-priority">
                                    <div className="priority-indicator">
                                        <div 
                                            className="priority-orb" 
                                            style={{ backgroundColor: getPriorityColor(ticket.priority) }} 
                                        />
                                        <span style={{ color: getPriorityColor(ticket.priority) }}>
                                            {ticket.priority.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="col-date">
                                    <span className="date-text">{formatDate(ticket.updated_at)}</span>
                                </div>

                                <div className="col-action">
                                    <button className="view-btn">
                                        <ArrowUpRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Deep Dive Overlay (Ticket Detail & Solution) */}
            {selectedTicket && (
                <div className="deep-dive-overlay">
                    <div className="deep-dive-container">
                        <div className="deep-dive-header">
                            <div className="header-label">
                                <Shield size={16} color="var(--sentinel-cyan)" />
                                <span>SECURE MONITORING VIEW</span>
                            </div>
                            <button className="close-dive" onClick={() => setSelectedTicket(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="deep-dive-body">
                            <div className="ticket-intel">
                                <div className="intel-core">
                                    <span className="intel-num">{selectedTicket.ticket_number}</span>
                                    <h2>{selectedTicket.subject}</h2>
                                    <div className="intel-meta">
                                        <div className="meta-item">
                                            <Calendar size={14} />
                                            <span>Logged: {formatDate(selectedTicket.created_at)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Activity size={14} />
                                            <span className={`status-${selectedTicket.status}`}>
                                                {selectedTicket.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="intel-description">
                                    <div className="section-label">ORIGINAL DESCRIPTOR</div>
                                    <p>{selectedTicket.description}</p>
                                </div>

                                {selectedTicket.solution && (
                                    <div className="intel-solution-view">
                                        <div className="section-label solution-label">OFFICIAL RESOLUTION</div>
                                        <div className="solution-box">
                                            {selectedTicket.solution}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="solution-console">
                                <div className="console-header">
                                    <Terminal size={18} color="var(--sentinel-cyan)" />
                                    <span>RESOLUTION CONSOLE</span>
                                </div>
                                <textarea 
                                    className="console-input"
                                    placeholder="Enter formal resolution protocol..."
                                    value={solutionText}
                                    onChange={(e) => setSolutionText(e.target.value)}
                                    disabled={selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'}
                                />
                                {(selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed') && (
                                    <button 
                                        className="finalize-btn"
                                        onClick={handleResolve}
                                        disabled={isResolving || !solutionText.trim()}
                                    >
                                        <Send size={18} />
                                        <span>{isResolving ? 'TRANSMITTING...' : 'FINALIZE RESOLUTION'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
