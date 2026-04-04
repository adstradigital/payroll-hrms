'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    X,
    Search, 
    Filter, 
    MoreHorizontal, 
    RefreshCw,
    Loader2,
    Inbox
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import CandidateCard from './CandidateCard';
import ResumeUploader from './ResumeUploader';
import { toast } from 'react-hot-toast';
import './ats.css';

const STATUS_COLUMNS = [
    { id: 'NEW', title: 'New Applications', color: '#3b82f6' },
    { id: 'SCREENING', title: 'Screening', color: '#a855f7' },
    { id: 'INTERVIEW', title: 'Interview', color: '#eab308' },
    { id: 'OFFERED', title: 'Offered', color: '#6366f1' },
    { id: 'HIRED', title: 'Hired', color: '#22c55e' }
];

const AtsBoard = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUploader, setShowUploader] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await recruitmentApi.getCandidates();
            if (response.data) {
                const data = Array.isArray(response.data) ? response.data : response.data.results || [];
                setCandidates(data);
            }
        } catch (error) {
            console.error('Failed to fetch candidates:', error);
            toast.error('Failed to load candidates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const filteredCandidates = candidates.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCandidatesByStatus = (status) => {
        return filteredCandidates.filter(c => c.status === status);
    };

    return (
        <div className="ats-container">
            {/* Modern Horizontal Header */}
            <header className="ats-header">
                <div className="ats-title-group">
                    <h1>Applicant Tracking System</h1>
                </div>
                
                <div className="ats-header-actions">
                    <div className="ats-search-wrapper">
                        <Search size={18} color="#64748b" />
                        <input 
                            type="text"
                            placeholder="Search candidates by name or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ats-search-input"
                        />
                    </div>
                    <button className="ats-action-btn-light" title="Filter">
                        <Filter size={18} />
                    </button>
                    <button 
                        onClick={fetchCandidates}
                        className="ats-action-btn-light"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowUploader(!showUploader)}
                        className="ats-primary-btn"
                    >
                        {showUploader ? <X size={18} /> : <Plus size={18} />}
                        <span>{showUploader ? 'Close Dashboard' : 'Bulk Upload Resumes'}</span>
                    </button>
                </div>
            </header>

            {/* Uploader Transition */}
            <AnimatePresence>
                {showUploader && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '2rem' }}
                    >
                        <ResumeUploader onUploadSuccess={() => fetchCandidates()} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modern Kanban Board */}
            <div className="ats-board scrollbar-hide">
                {STATUS_COLUMNS.map((column, index) => {
                    const items = getCandidatesByStatus(column.id);
                    
                    return (
                        <div key={column.id} className="ats-column">
                            <div className="ats-column-header">
                                <div className="ats-column-label">
                                    <div className="ats-column-dot" style={{ background: column.color }} />
                                    <h3 className="ats-column-title">{column.title}</h3>
                                    <span className="ats-column-pill">{items.length}</span>
                                </div>
                                <button className="ats-action-btn-light" style={{ border: 'none', background: 'transparent' }}>
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>

                            <div className="ats-column-body">
                                {loading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 size={24} className="text-blue animate-spin opacity-20" />
                                    </div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {items.length > 0 ? (
                                            items.map((candidate) => (
                                                <CandidateCard 
                                                    key={candidate.id} 
                                                    candidate={candidate} 
                                                    onRefresh={fetchCandidates}
                                                />
                                            ))
                                        ) : (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="empty-lane"
                                            >
                                                <Inbox size={32} color="#cbd5e1" />
                                                <h4 className="empty-title">No candidates yet</h4>
                                                <p className="empty-sub">
                                                    Candidates moved to this stage will appear here.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AtsBoard;
