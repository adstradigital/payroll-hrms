'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Search, 
    RefreshCw, 
    Settings, 
    Plus, 
    Briefcase, // Fallback for brand icon
    X,
    Check,
    User,
    ArrowRight,
    ArrowLeft,
    MoreVertical,
    Clock,
    MessageSquare,
    ExternalLink,
    Trash2
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './Pipeline.css';

const DEFAULT_STAGES = [
    { id: 'NEW', label: 'New', color: '#71717a' },
    { id: 'SCREENING', label: 'Screening', color: '#3b82f6' },
    { id: 'INTERVIEW', label: 'Interview', color: '#fbbf24' },
    { id: 'OFFERED', label: 'Offer', color: '#10b981' },
    { id: 'HIRED', label: 'Hired', color: '#8b5cf6' },
    { id: 'REJECTED', label: 'Rejected', color: '#ef4444' }
];

export default function Pipeline() {
    // State for Data
    const [pipelineData, setPipelineData] = useState({});
    const [loading, setLoading] = useState(true);
    
    // State for UI/Config
    const [stages, setStages] = useState(DEFAULT_STAGES);
    const [scale, setScale] = useState(1);
    const [showCustomize, setShowCustomize] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newStageName, setNewStageName] = useState('');

    const [isHeaderHidden, setIsHeaderHidden] = useState(false);

    useEffect(() => {
        // Load config from localStorage
        const savedStages = localStorage.getItem('pipelineStages');
        const savedScale = localStorage.getItem('pipelineScale');
        
        if (savedStages) {
            try {
                // Merge saved stages with default IDs to ensure backend compatibility if needed
                // For now, simply load them. 
                // In a real app, you might want to sync this with backend config.
                 setStages(JSON.parse(savedStages));
            } catch (e) {
                console.error("Error parsing saved stages", e);
            }
        }
        
        if (savedScale) setScale(parseFloat(savedScale));

        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await recruitmentApi.getCandidates();
            const candidates = response.data.results || [];
            processCandidates(candidates);
        } catch (error) {
            console.error('Failed to fetch pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const processCandidates = (candidates) => {
        const grouped = {};
        const processingIds = new Set();
        const processingEmails = new Set();
        
        // Ensure all current stages exist in grouped data
        stages.forEach(stage => grouped[stage.id] = []);

        candidates.forEach(candidate => {
            // Ensure ID exists
            const safeCandidate = { ...candidate };
            if (!safeCandidate.id) safeCandidate.id = `temp_${Math.random().toString(36).substr(2, 9)}`;

            // Prevent duplicates by ID
            if (processingIds.has(safeCandidate.id)) return;
            
            // Prevent duplicates by Email (strict uniqueness for view)
            // If email is missing, we fall back to allowing it (or could dedup by name)
            if (safeCandidate.email) {
                if (processingEmails.has(safeCandidate.email)) return;
                processingEmails.add(safeCandidate.email);
            }

            processingIds.add(safeCandidate.id);

            // Normalize status
            const status = safeCandidate.status; 
            const stageId = stages.find(s => s.id === status) ? status : 'NEW';
            
            if (!grouped[stageId]) grouped[stageId] = [];
            grouped[stageId].push(safeCandidate);
        });
        setPipelineData(grouped);
    };

    const handleSaveConfig = () => {
        localStorage.setItem('pipelineStages', JSON.stringify(stages));
        localStorage.setItem('pipelineScale', scale);
    };

    // Auto-save when config changes
    useEffect(() => {
        handleSaveConfig();
    }, [stages, scale]);

    const handleScaleChange = (newScale) => {
        const s = Math.max(0.5, Math.min(1.8, parseFloat(newScale)));
        setScale(s);
    };

    const handleAddStage = () => {
        if (!newStageName.trim()) return;
        const id = newStageName.toUpperCase().replace(/\s+/g, '_');
        // Simple color rotation
        const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
        const color = colors[stages.length % colors.length];
        
        setStages([...stages, { id, label: newStageName, color }]);
        setNewStageName('');
    };

    const handleRemoveStage = (id) => {
        if (confirm(`Are you sure you want to remove the "${id}" stage? Candidates in this stage may not be visible.`)) {
            setStages(stages.filter(s => s.id !== id));
        }
    };

    const handleMoveCandidate = async (e, candidateId, currentStageId, direction = 1) => {
        if (e && e.stopPropagation) e.stopPropagation();
        
        if (!candidateId) return;

        // Find next/prev stage
        const currentIndex = stages.findIndex(s => s.id === currentStageId);
        if (currentIndex === -1) return;
        
        const targetIndex = currentIndex + direction;
        
        // Bounds check
        if (targetIndex < 0 || targetIndex >= stages.length) return;
        
        const targetStage = stages[targetIndex];
        
        try {
            // Optimistic Update
            setPipelineData(prev => {
               const newData = { ...prev };
               
               // Create safe copies of arrays we will modify
               const currentCandidates = [...(newData[currentStageId] || [])];
               const targetCandidates = [...(newData[targetStage.id] || [])];

               const candidateToMove = currentCandidates.find(c => c.id === candidateId);
               
               if (candidateToMove) {
                   // Remove from current
                   newData[currentStageId] = currentCandidates.filter(c => c.id !== candidateId);
                   
                   // Add to next with updated status
                   targetCandidates.push({ ...candidateToMove, status: targetStage.id });
                   newData[targetStage.id] = targetCandidates;
               }
               return newData;
            });

            await recruitmentApi.updateCandidateStatus(candidateId, targetStage.id);
        } catch (error) {
            console.error("Failed to move candidate", error);
            fetchCandidates(); // Revert on error
        }
    };

    // Toggle full screen / customization mode
    const toggleCustomize = (isOpen) => {
        setShowCustomize(isOpen);
        setIsHeaderHidden(isOpen);
    };

    // Helpers
    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };
    
    const getDaysInStage = (date) => {
        if (!date) return 0;
        const diff = new Date() - new Date(date);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="pipeline-container">
            {/* Header */}
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn-icon-only btn" onClick={fetchCandidates} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn btn-outline" onClick={() => toggleCustomize(true)}>
                        <Settings size={16} />
                        Customize View
                    </button>
                    <button className="btn btn-primary" onClick={() => alert("Add Talent Modal implementation required")}>
                        <Plus size={16} strokeWidth={3} />
                        Add Talent
                    </button>
                </div>
            </header>

            {/* Board Viewport */}
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
                            stages.map(stage => {
                                const candidates = pipelineData[stage.id] || [];
                                const filteredCandidates = candidates.filter(c => 
                                    !searchQuery || 
                                    (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (c.current_job_title || '').toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                return (
                                    <div key={stage.id} className="column">
                                        <div className="column-header">
                                            <div className="status-dot" style={{ backgroundColor: stage.color, color: stage.color }}></div>
                                            <span className="column-title">{stage.label}</span>
                                            <span className="column-count">{filteredCandidates.length}</span>
                                        </div>
                                        <div className="cards-container">
                                            {filteredCandidates.map(candidate => (
                                                <div key={candidate.id} className="card">
                                                    <div className="card-header">
                                                        <div className="avatar">
                                                            {getInitials(candidate.full_name)}
                                                        </div>
                                                        <div className="card-info">
                                                            <h3>{candidate.full_name || 'Unknown Candidate'}</h3>
                                                            <p>{candidate.current_job_title || 'Applicant'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="card-tags">
                                                        <div className="tag">
                                                            <Clock size={12} />
                                                            {getDaysInStage(candidate.created_at)}d
                                                        </div>
                                                        <div className="tag">
                                                            <MessageSquare size={12} />
                                                            Talk
                                                        </div>
                                                    </div>
                                                    <div className="card-actions">
                                                        {stages.findIndex(s => s.id === stage.id) > 0 && (
                                                            <button 
                                                                className="btn-back"
                                                                title="Move Back"
                                                                onClick={(e) => handleMoveCandidate(e, candidate.id, stage.id, -1)}
                                                            >
                                                                <ArrowLeft size={16} />
                                                            </button>
                                                        )}
                                                        {stages.findIndex(s => s.id === stage.id) < stages.length - 1 && (
                                                            <button 
                                                                className="btn-advance"
                                                                onClick={(e) => handleMoveCandidate(e, candidate.id, stage.id, 1)}
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
                                            {filteredCandidates.length === 0 && (
                                                <div className="empty-state">Empty</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Customize Panel */}
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
                        <span>UI ZOOM</span>
                        <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <div className="slider-row">
                        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => handleScaleChange(scale - 0.1)}>-</button>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="1.8" 
                            step="0.05" 
                            value={scale} 
                            onChange={(e) => handleScaleChange(e.target.value)} 
                        />
                        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => handleScaleChange(scale + 0.1)}>+</button>
                    </div>
                </div>

                <div className="stage-architect">
                    <div className="section-title">Pipeline Stages</div>
                    <div className="architect-controls">
                        {stages.map(stage => (
                            <div key={stage.id} className="stage-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="status-dot" style={{ backgroundColor: stage.color, width: '6px', height: '6px' }}></div>
                                    <span>{stage.label}</span>
                                </div>
                                <button onClick={() => handleRemoveStage(stage.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="add-stage-form">
                        <input 
                            type="text" 
                            placeholder="New Stage Name..." 
                            value={newStageName}
                            onChange={(e) => setNewStageName(e.target.value)}
                        />
                        <button className="btn btn-primary" style={{ padding: '10px' }} onClick={handleAddStage}>
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div className="panel-footer">
                    <button className="btn btn-outline" onClick={() => {
                        if(confirm("Reset to default stages?")) {
                            setStages(DEFAULT_STAGES);
                            setScale(1);
                        }
                    }}>Reset Default</button>
                    <button className="btn btn-primary" onClick={() => toggleCustomize(false)}>Done</button>
                </div>
            </div>
        </div>
    );
}
