'use client';

import './PipelineStatus.css';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type PipelineStatusData = {
    screening?: number;
    interview?: number;
    offer?: number;
    hired?: number;
};

export default function PipelineStatus({ data, loading }: { data?: PipelineStatusData; loading?: boolean }) {
    const stages = [
        { label: 'Screening', value: data?.screening ?? 0, color: '#4f46e5' },
        { label: 'Interview', value: data?.interview ?? 0, color: '#f59e0b' },
        { label: 'Offer', value: data?.offer ?? 0, color: '#22c55e' },
        { label: 'Hired', value: data?.hired ?? 0, color: '#0ea5e9' },
    ];

    const total = stages.reduce((sum, stage) => sum + stage.value, 0) || 0;

    let offset = 0;

    return (
        <div className="pipeline-status">
            <div className="pipeline-chart">
                <svg viewBox="0 0 140 140" aria-label="Pipeline status donut chart">
                    <circle
                        cx="70"
                        cy="70"
                        r={RADIUS}
                        className="pipeline-track"
                        strokeWidth="18"
                    />
                    {stages.map((stage, index) => {
                        if (!total) return null;
                        const fraction = stage.value / total;
                        const stroke = fraction * CIRCUMFERENCE;
                        const dasharray = `${stroke} ${CIRCUMFERENCE - stroke}`;
                        const circle = (
                            <circle
                                key={stage.label}
                                cx="70"
                                cy="70"
                                r={RADIUS}
                                fill="none"
                                stroke={stage.color}
                                strokeWidth="18"
                                strokeDasharray={dasharray}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                            />
                        );
                        offset += stroke;
                        return circle;
                    })}
                </svg>
                <div className="pipeline-center">
                    <div className="pipeline-total">{loading ? '...' : total}</div>
                    <div className="pipeline-muted">Total</div>
                </div>
            </div>

            <div className="pipeline-legend">
                {stages.map((stage) => {
                    const percent = total ? Math.round((stage.value / total) * 100) : 0;
                    return (
                        <div key={stage.label} className="pipeline-legend__item">
                            <span className="pipeline-dot" style={{ background: stage.color }} />
                            <span className="pipeline-label">{stage.label}</span>
                            <span className="pipeline-value">
                                {loading ? '...' : `${percent}%`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
