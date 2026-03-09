'use client';

import React, { useState } from 'react';
import { GripVertical, Edit2, Trash2, Plus, Check } from 'lucide-react';
import './Stages.css';

export default function Stages() {
    const [stages] = useState([
        { id: 1, name: 'Applied', type: 'System', color: 'gray' },
        { id: 2, name: 'Screening', type: 'Custom', color: 'blue' },
        { id: 3, name: 'Technical Interview', type: 'Custom', color: 'purple' },
        { id: 4, name: 'Cultural Fit Round', type: 'Custom', color: 'indigo' },
        { id: 5, name: 'Offer', type: 'System', color: 'green' },
        { id: 6, name: 'Hired', type: 'System', color: 'emerald' },
        { id: 7, name: 'Rejected', type: 'System', color: 'red' },
    ]);

    return (
        <div className="stages-container">
            <div className="stages-header">
                <div>
                    <h2>Recruitment Stages</h2>
                    <p>Customize your hiring pipeline stages.</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} /> Add New Stage
                </button>
            </div>

            <div className="stages-wrapper">
                <div className="stages-list">
                    {stages.map((stage, index) => (
                        <div key={stage.id} className="stage-item">
                            <div className="drag-handle">
                                <GripVertical size={20} />
                            </div>
                            <div className="stage-content">
                                <div className={`stage-badge ${stage.color}`}>
                                    {index + 1}
                                </div>
                                <div className="stage-info">
                                    <h3>{stage.name}</h3>
                                    <span className="stage-type">{stage.type} Stage</span>
                                </div>
                            </div>
                            <div className="stage-actions">
                                {stage.type === 'Custom' && (
                                    <>
                                        <button className="icon-btn edit" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="icon-btn delete" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                                {stage.type === 'System' && (
                                    <span className="system-badge">Default</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="stages-preview">
                    <h3>Pipeline Preview</h3>
                    <div className="preview-container">
                        {stages.filter(s => s.name !== 'Rejected').map((stage, idx) => (
                            <React.Fragment key={stage.id}>
                                <div className="preview-node">
                                    {stage.name}
                                </div>
                                {idx < stages.filter(s => s.name !== 'Rejected').length - 1 && (
                                    <div className="preview-connector"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
