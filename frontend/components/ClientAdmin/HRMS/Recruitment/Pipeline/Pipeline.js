'use client';

import { useEffect, useState } from 'react';
import {
    Search,
    RefreshCw,
    Settings,
    X,
    ArrowRight,
    ArrowLeft,
    Clock,
    MessageSquare,
    ExternalLink,
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Pipeline.css';

const STAGE_COLORS = ['#64748b', '#3b82f6', '#8b5cf6', '#6366f1', '#10b981', '#16a34a', '#ef4444'];

const decorateStages = (items) =>
    items.map((stage, index) => ({
        ...stage,
        label: stage.name,
        color: STAGE_COLORS[index % STAGE_COLORS.length],
    }));

const groupCandidatesByStage = (candidates, stageList) => {
    const grouped = Object.fromEntries(stageList.map((stage) => [stage.id, []]));
    const fallbackStage = stageList[0];

    candidates.forEach((candidate) => {
        const stageId = candidate.stage || candidate.stage_details?.id || fallbackStage?.id;
        if (!stageId || !grouped[stageId]) {
            if (fallbackStage) grouped[fallbackStage.id].push(candidate);
            return;
        }
        grouped[stageId].push(candidate);
    });

    return grouped;
};

const groupPipelineResponseByStageId = (pipelineResponse, stageList) => {
    const grouped = Object.fromEntries(stageList.map((stage) => [stage.id, []]));
    const payload = pipelineResponse?.data?.data || pipelineResponse?.data || {};

    const stageNameToId = new Map(stageList.map((stage) => [String(stage.name).toLowerCase(), stage.id]));

    Object.entries(payload || {}).forEach(([stageName, candidates]) => {
        const stageId = stageNameToId.get(String(stageName).toLowerCase());
        if (!stageId) return;
        grouped[stageId] = (candidates || []).map((candidate) => ({
            ...candidate,
            full_name: candidate.full_name || candidate.name || '',
            stage: stageId,
            stage_name: candidate.stage_name || stageName,
        }));
    });

    return grouped;
};

export default function Pipeline() {
    const [pipelineData, setPipelineData] = useState({});
    const [loading, setLoading] = useState(true);
    const [stages, setStages] = useState([]);
    const [scale, setScale] = useState(1);
    const [showCustomize, setShowCustomize] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const [dragOverStageId, setDragOverStageId] = useState(null);

    useEffect(() => {
        const savedScale = localStorage.getItem('pipelineScale');
        if (savedScale) setScale(parseFloat(savedScale));
        fetchPipeline();
    }, []);

    useEffect(() => {
        localStorage.setItem('pipelineScale', scale);
    }, [scale]);

    const fetchPipeline = async () => {
        setLoading(true);

        try {
            const [stagesResponse, pipelineResponse] = await Promise.all([recruitmentApi.getStages(), recruitmentApi.getPipeline()]);

            const nextStages = decorateStages(stagesResponse.data?.data || []);

            setStages(nextStages);
            setPipelineData(groupPipelineResponseByStageId(pipelineResponse, nextStages));
        } catch (error) {
            console.error('Failed to fetch pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScaleChange = (newScale) => {
        const nextScale = Math.max(0.5, Math.min(1.8, parseFloat(newScale)));
        setScale(nextScale);
    };

    const moveCandidateOptimistic = (candidateId, fromStageId, toStage) => {
        setPipelineData((previous) => {
            const next = { ...previous };
            const fromCandidates = [...(next[fromStageId] || [])];
            const toCandidates = [...(next[toStage.id] || [])];
            const candidate = fromCandidates.find((item) => item.id === candidateId);

            if (!candidate) return previous;

            next[fromStageId] = fromCandidates.filter((item) => item.id !== candidateId);
            toCandidates.push({
                ...candidate,
                stage: toStage.id,
                stage_name: toStage.name,
                stage_details: toStage,
            });
            next[toStage.id] = toCandidates;

            return next;
        });
    };

    const persistCandidateMove = async (candidateId, targetStageId) => {
        await recruitmentApi.updateCandidateStage(candidateId, targetStageId);
    };

    const handleMoveCandidate = async (event, candidateId, currentStageId, direction = 1) => {
        if (event?.stopPropagation) event.stopPropagation();

        const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);
        const targetIndex = currentIndex + direction;

        if (currentIndex === -1 || targetIndex < 0 || targetIndex >= stages.length) {
            return;
        }

        const targetStage = stages[targetIndex];

        moveCandidateOptimistic(candidateId, currentStageId, targetStage);

        try {
            await persistCandidateMove(candidateId, targetStage.id);
        } catch (error) {
            console.error('Failed to move candidate', error);
            fetchPipeline();
        }
    };

    const handleDragStart = (event, candidateId, stageId) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({ candidateId, stageId }));
    };

    const handleDrop = async (event, targetStageId) => {
        event.preventDefault();
        setDragOverStageId(null);

        let payload;
        try {
            payload = JSON.parse(event.dataTransfer.getData('application/json') || '{}');
        } catch {
            payload = null;
        }

        const candidateId = payload?.candidateId;
        const fromStageId = payload?.stageId;
        if (!candidateId || !fromStageId || fromStageId === targetStageId) return;

        const targetStage = stages.find((stage) => stage.id === targetStageId);
        if (!targetStage) return;

        moveCandidateOptimistic(candidateId, fromStageId, targetStage);

        try {
            await persistCandidateMove(candidateId, targetStage.id);
        } catch (error) {
            console.error('Failed to move candidate', error);
            fetchPipeline();
        }
    };

    const toggleCustomize = (isOpen) => {
        setShowCustomize(isOpen);
        setIsHeaderHidden(isOpen);
    };

    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    };

    const getDaysInStage = (date) => {
        if (!date) return 0;
        const diff = new Date() - new Date(date);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="pipeline-container">
            <header className={`pipeline-header-main ${isHeaderHidden ? 'hidden' : ''}`}>
                <div className="brand">
                    <div className="logo-box">R</div>
                    <div className="brand-text">
                        <h1>PIPELINE</h1>
                        <p>Talent Flow</p>
                    </div>
                </div>

                <div className="controls">
                    <div className="search-container">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Find talent..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />
                    </div>
                    <button className="btn-icon-only btn" onClick={fetchPipeline} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn btn-outline" onClick={() => toggleCustomize(true)}>
                        <Settings size={16} />
                        Customize View
                    </button>
                </div>
            </header>

            <div className={`board-viewport ${isHeaderHidden ? 'full-height' : ''}`}>
                <div
                    className="scale-wrapper"
                    style={{
                        transform: `scale(${scale})`,
                        width: `${scale * 100}%`,
                    }}
                >
                    <div className="pipeline-board">
                        {loading ? (
                            <div className="loading-state">Loading pipeline data...</div>
                        ) : (
                            stages.map((stage) => {
                                const candidates = pipelineData[stage.id] || [];
                                 const filteredCandidates = candidates.filter(
                                     (candidate) =>
                                         !searchQuery ||
                                         (candidate.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                         (candidate.job_title || candidate.job || '').toLowerCase().includes(searchQuery.toLowerCase())
                                 );

                                return (
                                    <div
                                        key={stage.id}
                                        className={`column ${dragOverStageId === stage.id ? 'column--dragover' : ''}`}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            setDragOverStageId(stage.id);
                                        }}
                                        onDragLeave={() => setDragOverStageId(null)}
                                        onDrop={(event) => handleDrop(event, stage.id)}
                                    >
                                        <div className="column-header">
                                            <div className="status-dot" style={{ backgroundColor: stage.color, color: stage.color }} />
                                            <span className="column-title">{stage.label}</span>
                                            <span className="column-count">{filteredCandidates.length}</span>
                                        </div>

                                        <div className="cards-container">
                                            {filteredCandidates.map((candidate) => (
                                                <div
                                                    key={candidate.id}
                                                    className="card"
                                                    draggable
                                                    onDragStart={(event) => handleDragStart(event, candidate.id, stage.id)}
                                                >
                                                    <div className="card-header">
                                                        <div className="avatar">{getInitials(candidate.full_name)}</div>
                                                        <div className="card-info">
                                                            <h3>{candidate.full_name || 'Unknown Candidate'}</h3>
                                                            <p>{candidate.job_title || candidate.job || 'No job assigned'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="card-tags">
                                                        <div className="tag">
                                                            <Clock size={12} />
                                                            {getDaysInStage(candidate.created_at)}d
                                                        </div>
                                                        <div className="tag">
                                                            <MessageSquare size={12} />
                                                            {candidate.stage_name || stage.label}
                                                        </div>
                                                    </div>

                                                    <div className="card-meta">
                                                        <div className="meta-row">{candidate.experience_display || candidate.experience || ''}</div>
                                                        {candidate.email && <div className="meta-row meta-row--muted">{candidate.email}</div>}
                                                    </div>

                                                    <div className="card-actions">
                                                        {stages.findIndex((item) => item.id === stage.id) > 0 && (
                                                            <button
                                                                className="btn-back"
                                                                title="Move Back"
                                                                onClick={(event) => handleMoveCandidate(event, candidate.id, stage.id, -1)}
                                                            >
                                                                <ArrowLeft size={16} />
                                                            </button>
                                                        )}

                                                        {stages.findIndex((item) => item.id === stage.id) < stages.length - 1 && (
                                                            <button
                                                                className="btn-advance"
                                                                onClick={(event) => handleMoveCandidate(event, candidate.id, stage.id, 1)}
                                                            >
                                                                Advance <ArrowRight size={12} strokeWidth={4} />
                                                            </button>
                                                        )}

                                                        <button className="btn-external">
                                                            <ExternalLink size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {filteredCandidates.length === 0 && <div className="empty-state">Empty</div>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className={`customize-panel ${showCustomize ? 'active' : ''}`}>
                <div className="panel-header">
                    <h2>Workflow Architect</h2>
                    <button className="btn-icon-only btn" style={{ border: 'none' }} onClick={() => toggleCustomize(false)}>
                        <X size={18} />
                    </button>
                </div>

                <div className="scale-control">
                    <div className="section-title">Visual Scaling</div>
                    <div className="scale-info">
                        <span>UI Zoom</span>
                        <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <div className="slider-row">
                        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => handleScaleChange(scale - 0.1)}>
                            -
                        </button>
                        <input
                            type="range"
                            min="0.5"
                            max="1.8"
                            step="0.05"
                            value={scale}
                            onChange={(event) => handleScaleChange(event.target.value)}
                        />
                        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => handleScaleChange(scale + 0.1)}>
                            +
                        </button>
                    </div>
                </div>

                <div className="stage-architect">
                    <div className="section-title">Active Pipeline Stages</div>
                    <div className="architect-controls">
                        {stages.map((stage) => (
                            <div key={stage.id} className="stage-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="status-dot" style={{ backgroundColor: stage.color, width: '6px', height: '6px' }} />
                                    <span>{stage.label}</span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>
                                    {stage.is_system ? 'System' : 'Custom'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="add-stage-form">
                        <input type="text" readOnly value="Manage stage names and order from the Stages tab." />
                    </div>
                </div>

                <div className="panel-footer">
                    <button className="btn btn-outline" onClick={() => setScale(1)}>
                        Reset Zoom
                    </button>
                    <button className="btn btn-primary" onClick={() => toggleCustomize(false)}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
