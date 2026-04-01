'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import './ats.css';

const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
};

const CandidateCard = ({ candidate }: { candidate: any }) => {
    const initials = `${candidate.first_name?.[0] || ''}${candidate.last_name?.[0] || ''}`.toUpperCase() || 'U';
    const timeAgo = formatTimeAgo(candidate.applied_date || candidate.created_at);
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="candidate-card"
        >
            <div className="candidate-info">
                <div className="candidate-avatar">
                   {initials}
                </div>
                <div>
                    <h4 className="candidate-name">
                        {candidate.first_name} {candidate.last_name}
                    </h4>
                    <p className="candidate-role">
                        {candidate.current_job_title || 'Application Received'}
                    </p>
                </div>
            </div>

            <div className="candidate-footer">
                <Clock size={12} color="#64748b" />
                <span>{timeAgo || 'Recently applied'}</span>
            </div>
        </motion.div>
    );
};

export default CandidateCard;
