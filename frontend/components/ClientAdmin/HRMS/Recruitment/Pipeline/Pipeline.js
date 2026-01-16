'use client';

import { useState } from 'react';
import { Plus, User, ArrowRight } from 'lucide-react';
import './Pipeline.css';

const pipelineStages = [
    { id: 'applied', label: 'Applied', color: '#64748b' },
    { id: 'screening', label: 'Screening', color: '#3b82f6' },
    { id: 'interview', label: 'Interview', color: '#f59e0b' },
    { id: 'offer', label: 'Offer', color: '#10b981' },
    { id: 'hired', label: 'Hired', color: '#8b5cf6' },
];

const mockPipeline = {
    applied: [
        { id: 1, name: 'John Doe', position: 'React Developer', days: 2 },
        { id: 2, name: 'Jane Smith', position: 'Designer', days: 1 },
    ],
    screening: [
        { id: 3, name: 'Mike Wilson', position: 'React Developer', days: 5 },
    ],
    interview: [
        { id: 4, name: 'Sarah Brown', position: 'Marketing Manager', days: 3 },
        { id: 5, name: 'Tom Davis', position: 'HR Executive', days: 2 },
    ],
    offer: [
        { id: 6, name: 'Emily Chen', position: 'Designer', days: 1 },
    ],
    hired: [],
};

export default function Pipeline() {
    const [pipeline, setPipeline] = useState(mockPipeline);

    const moveCandidate = (candidateId, fromStage, toStage) => {
        const candidate = pipeline[fromStage].find(c => c.id === candidateId);
        if (!candidate) return;

        setPipeline(prev => ({
            ...prev,
            [fromStage]: prev[fromStage].filter(c => c.id !== candidateId),
            [toStage]: [...prev[toStage], { ...candidate, days: 0 }],
        }));
    };

    return (
        <div className="pipeline">
            <div className="pipeline-header">
                <h2 className="pipeline-title">Recruitment Pipeline</h2>
                <button className="btn btn-primary">
                    <Plus size={18} />
                    Add Candidate
                </button>
            </div>

            <div className="pipeline-board">
                {pipelineStages.map((stage, index) => (
                    <div key={stage.id} className="pipeline-column">
                        <div className="pipeline-column__header" style={{ borderColor: stage.color }}>
                            <span className="pipeline-column__title">{stage.label}</span>
                            <span className="pipeline-column__count">{pipeline[stage.id]?.length || 0}</span>
                        </div>

                        <div className="pipeline-column__cards">
                            {pipeline[stage.id]?.map(candidate => (
                                <div key={candidate.id} className="pipeline-card">
                                    <div className="pipeline-card__avatar">
                                        <User size={16} />
                                    </div>
                                    <div className="pipeline-card__info">
                                        <span className="pipeline-card__name">{candidate.name}</span>
                                        <span className="pipeline-card__position">{candidate.position}</span>
                                        <span className="pipeline-card__days">{candidate.days} days in stage</span>
                                    </div>
                                    {index < pipelineStages.length - 1 && (
                                        <button
                                            className="pipeline-card__move"
                                            onClick={() => moveCandidate(candidate.id, stage.id, pipelineStages[index + 1].id)}
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {pipeline[stage.id]?.length === 0 && (
                                <div className="pipeline-empty">No candidates</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
