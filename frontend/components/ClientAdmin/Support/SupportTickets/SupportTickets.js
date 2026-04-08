'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, MessageSquare, CheckCircle, X } from 'lucide-react';
import * as supportApi from '@/api/supportApi';
import './SupportTickets.css';

export default function SupportTickets() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Show success toast when redirected from ticket creation
    useEffect(() => {
        if (searchParams?.get('created') === 'true') {
            setShowSuccessToast(true);
            const timer = setTimeout(() => setShowSuccessToast(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, [activeTab, searchQuery]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (activeTab !== 'all') filters.status = activeTab;
            if (searchQuery) filters.search = searchQuery;

            const [ticketsData, statsData] = await Promise.all([
                supportApi.getMyTickets(filters),
                supportApi.getTicketStats(),
            ]);

            setTickets(ticketsData.results || ticketsData);
            setStats(statsData);
        } catch (err) {
            setError('Failed to load tickets');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTicketClick = (id) => {
        router.push(`/dashboard/support/tickets/${id}`);
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'open': 'status-badge--open',
            'in_progress': 'status-badge--in-progress',
            'resolved': 'status-badge--resolved',
            'closed': 'status-badge--closed',
        };
        return statusMap[status] || '';
    };

    const getPriorityBadgeClass = (priority) => {
        const priorityMap = {
            'low': 'priority-badge--low',
            'medium': 'priority-badge--medium',
            'high': 'priority-badge--high',
            'urgent': 'priority-badge--urgent',
        };
        return priorityMap[priority] || '';
    };

    const formatStatus = (status) => {
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="support-tickets">
            {/* Success Toast */}
            {showSuccessToast && (
                <div className="ticket-success-toast">
                    <CheckCircle size={18} />
                    <span>Ticket created successfully! Our team will respond shortly.</span>
                    <button onClick={() => setShowSuccessToast(false)} className="ticket-success-toast__close">
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="support-tickets__header">
                <div>
                    <h1>Support Tickets</h1>
                    <p>Manage and track your support requests</p>
                </div>
                <button
                    className="support-tickets__create-btn"
                    onClick={() => router.push('/dashboard/support/tickets/new')}
                >
                    <Plus size={20} />
                    Create New Ticket
                </button>
            </div>

            {/* Tabs — always rendered, counts default to 0 before stats load */}
            <div className="support-tickets__tabs">
                {[
                    { key: 'all', label: 'All', count: stats?.total ?? '…' },
                    { key: 'open', label: 'Open', count: stats?.open ?? '…' },
                    { key: 'in_progress', label: 'In Progress', count: stats?.in_progress ?? '…' },
                    { key: 'resolved', label: 'Resolved', count: stats?.resolved ?? '…' },
                    { key: 'closed', label: 'Closed', count: stats?.closed ?? '…' },
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        className={`support-tickets__tab ${activeTab === key ? 'support-tickets__tab--active' : ''}`}
                        onClick={() => setActiveTab(key)}
                    >
                        {label}
                        <span className={`support-tickets__tab-count ${activeTab === key ? 'support-tickets__tab-count--active' : ''}`}>
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="support-tickets__search">
                <Search className="support-tickets__search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search by ticket number or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {error && (
                <div className="support-tickets__error">
                    {error}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="support-tickets__loading">
                    <div className="spinner"></div>
                    <p>Loading tickets...</p>
                </div>
            ) : tickets.length === 0 ? (
                <div className="support-tickets__empty">
                    <MessageSquare size={64} />
                    <h3>No tickets found</h3>
                    <p>Create your first support ticket to get started</p>
                    <button
                        className="support-tickets__empty-btn"
                        onClick={() => router.push('/dashboard/support/tickets/new')}
                    >
                        Create Ticket
                    </button>
                </div>
            ) : (
                <div className="support-tickets__table-container">
                    <table className="support-tickets__table">
                        <thead>
                            <tr>
                                <th>Ticket Number</th>
                                <th>Subject</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Date</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket) => (
                                <tr
                                    key={ticket.id}
                                    onClick={() => handleTicketClick(ticket.id)}
                                    className="support-tickets__table-row"
                                >
                                    <td className="support-tickets__ticket-number">
                                        {ticket.ticket_number}
                                    </td>
                                    <td className="support-tickets__subject">
                                        {ticket.subject}
                                    </td>
                                    <td>{ticket.category_name || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                                            {formatStatus(ticket.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`priority-badge ${getPriorityBadgeClass(ticket.priority)}`}>
                                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                        </span>
                                    </td>
                                    <td>{formatDate(ticket.created_at)}</td>
                                    <td className="support-tickets__comments">
                                        <MessageSquare size={16} />
                                        {ticket.comments_count || 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
