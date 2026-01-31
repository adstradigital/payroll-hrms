'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, Tag, MessageSquare, Paperclip, Send, X, CheckCircle } from 'lucide-react';
import * as supportApi from '@/api/supportApi';
import './TicketDetail.css';

export default function TicketDetail({ ticketId }) {
    const router = useRouter();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const data = await supportApi.getTicketById(ticketId);
            setTicket(data);
        } catch (err) {
            setError('Failed to load ticket');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            setSubmittingComment(true);
            await supportApi.addComment(ticketId, comment);
            setComment('');
            await fetchTicket(); // Refresh ticket data
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleCloseTicket = async () => {
        try {
            await supportApi.closeTicket(ticketId);
            await fetchTicket();
        } catch (err) {
            console.error('Failed to close ticket:', err);
        }
    };

    const handleReopenTicket = async () => {
        try {
            await supportApi.reopenTicket(ticketId);
            await fetchTicket();
        } catch (err) {
            console.error('Failed to reopen ticket:', err);
        }
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
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="ticket-detail">
                <div className="ticket-detail__loading">
                    <div className="spinner"></div>
                    <p>Loading ticket...</p>
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="ticket-detail">
                <div className="ticket-detail__error">
                    {error || 'Ticket not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="ticket-detail">
            {/* Header */}
            <div className="ticket-detail__header">
                <button
                    className="ticket-detail__back-btn"
                    onClick={() => router.push('/dashboard/support/tickets')}
                >
                    <ArrowLeft size={20} />
                    Back to Tickets
                </button>

                <div className="ticket-detail__title-section">
                    <div className="ticket-detail__title-row">
                        <h1>{ticket.subject}</h1>
                        <div className="ticket-detail__badges">
                            <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                                {formatStatus(ticket.status)}
                            </span>
                            <span className={`priority-badge ${getPriorityBadgeClass(ticket.priority)}`}>
                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div className="ticket-detail__ticket-number">
                        Ticket #{ticket.ticket_number}
                    </div>
                </div>
            </div>

            <div className="ticket-detail__layout">
                {/* Main Content */}
                <div className="ticket-detail__main">
                    {/* Ticket Info Card */}
                    <div className="ticket-detail__info-card">
                        <div className="ticket-detail__info-item">
                            <Tag size={18} />
                            <div>
                                <span className="ticket-detail__info-label">Category</span>
                                <span className="ticket-detail__info-value">{ticket.category_name || 'Uncategorized'}</span>
                            </div>
                        </div>
                        <div className="ticket-detail__info-item">
                            <User size={18} />
                            <div>
                                <span className="ticket-detail__info-label">Created by</span>
                                <span className="ticket-detail__info-value">{ticket.employee_name}</span>
                            </div>
                        </div>
                        <div className="ticket-detail__info-item">
                            <Calendar size={18} />
                            <div>
                                <span className="ticket-detail__info-label">Created on</span>
                                <span className="ticket-detail__info-value">{formatDate(ticket.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="ticket-detail__section">
                        <h3>Description</h3>
                        <p>{ticket.description}</p>
                    </div>

                    {/* Attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="ticket-detail__section">
                            <h3>Attachments</h3>
                            <div className="ticket-detail__attachments">
                                {ticket.attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ticket-detail__attachment"
                                    >
                                        <Paperclip size={16} />
                                        {attachment.filename}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments Timeline */}
                    <div className="ticket-detail__section">
                        <h3>Comments ({ticket.comments?.length || 0})</h3>
                        <div className="ticket-detail__timeline">
                            {ticket.comments && ticket.comments.map((comment) => (
                                <div key={comment.id} className="ticket-detail__comment">
                                    <div className="ticket-detail__comment-avatar">
                                        {comment.author_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="ticket-detail__comment-content">
                                        <div className="ticket-detail__comment-header">
                                            <span className="ticket-detail__comment-author">{comment.author_name}</span>
                                            <span className="ticket-detail__comment-time">{formatDate(comment.created_at)}</span>
                                        </div>
                                        <p className="ticket-detail__comment-text">{comment.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Comment */}
                    {ticket.status !== 'closed' && (
                        <form className="ticket-detail__add-comment" onSubmit={handleAddComment}>
                            <textarea
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                            />
                            <button
                                type="submit"
                                disabled={!comment.trim() || submittingComment}
                            >
                                <Send size={18} />
                                {submittingComment ? 'Sending...' : 'Send Comment'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Sidebar Actions */}
                <aside className="ticket-detail__sidebar">
                    <h3>Actions</h3>
                    {ticket.status === 'closed' ? (
                        <button
                            className="ticket-detail__action-btn ticket-detail__action-btn--reopen"
                            onClick={handleReopenTicket}
                        >
                            <X size={18} />
                            Reopen Ticket
                        </button>
                    ) : (
                        <button
                            className="ticket-detail__action-btn ticket-detail__action-btn--close"
                            onClick={handleCloseTicket}
                        >
                            <CheckCircle size={18} />
                            Close Ticket
                        </button>
                    )}
                </aside>
            </div>
        </div>
    );
}
