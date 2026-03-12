'use client';

import './ApplicationSource.css';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ApplicationSourcesData = {
    linkedin?: number;
    website?: number;
    referral?: number;
    job_portal?: number;
};

export default function ApplicationSource({ data, loading }: { data?: ApplicationSourcesData; loading?: boolean }) {
    const sources = [
        { label: 'LinkedIn', value: data?.linkedin ?? 0, color: '#4f46e5' },
        { label: 'Website', value: data?.website ?? 0, color: '#0ea5e9' },
        { label: 'Referral', value: data?.referral ?? 0, color: '#10b981' },
        { label: 'Job Portal', value: data?.job_portal ?? 0, color: '#f97316' },
    ];

    const total = sources.reduce((sum, s) => sum + s.value, 0) || 0;
    let offset = 0;

    return (
        <div className="app-source">
            <div className="app-source__chart">
                <svg viewBox="0 0 150 150" aria-label="Application sources donut chart">
                    <circle
                        cx="75"
                        cy="75"
                        r={RADIUS}
                        className="app-source__track"
                        strokeWidth="20"
                    />
                    {sources.map((source) => {
                        if (!total) return null;
                        const fraction = source.value / total;
                        const stroke = fraction * CIRCUMFERENCE;
                        const dasharray = `${stroke} ${CIRCUMFERENCE - stroke}`;
                        const circle = (
                            <circle
                                key={source.label}
                                cx="75"
                                cy="75"
                                r={RADIUS}
                                fill="none"
                                stroke={source.color}
                                strokeWidth="20"
                                strokeDasharray={dasharray}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                            />
                        );
                        offset += stroke;
                        return circle;
                    })}
                </svg>
                <div className="app-source__center">
                    <div className="app-source__total">{loading ? '...' : total}</div>
                    <div className="app-source__muted">Applications</div>
                </div>
            </div>

            <div className="app-source__legend">
                {sources.map((source) => {
                    const percent = total ? Math.round((source.value / total) * 100) : 0;
                    return (
                        <div key={source.label} className="app-source__item">
                            <span className="app-source__dot" style={{ background: source.color }} />
                            <span className="app-source__label">{source.label}</span>
                            <span className="app-source__value">{loading ? '...' : `${percent}%`}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
