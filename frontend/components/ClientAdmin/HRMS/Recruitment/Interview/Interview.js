'use client';

import React from 'react';
import { Calendar, User, Clock } from 'lucide-react';
import './Interview.css';

export default function Interview() {
    return (
        <div className="interview-container">
            <div className="interview-header">
                <h2>Interviews</h2>
                <div className="interview-actions">
                    <button className="btn btn-primary">Schedule Interview</button>
                </div>
            </div>
            <div className="interview-list">
                <div className="empty-state">
                    <Calendar size={48} />
                    <p>No upcoming interviews scheduled.</p>
                </div>
            </div>
        </div>
    );
}
