import React, { useState, useEffect } from 'react';
import {
    Award, Star, TrendingUp, History,
    ChevronRight, Target, AlertCircle,
    CheckCircle2, Info, Coins
} from 'lucide-react';
import { getAdhocPayments, getReviews, calculateBonus } from '../../../../../../api/api_clientadmin';
import './ProfileBonusPoints.css';

const ProfileBonusPoints = ({ employeeId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bonusHistory, setBonusHistory] = useState([]);
    const [latestReview, setLatestReview] = useState(null);
    const [projectedBonus, setProjectedBonus] = useState(null);
    const [totalPoints, setTotalPoints] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch adhoc payments (bonuses) and reviews in parallel
                const [paymentsRes, reviewsRes] = await Promise.all([
                    getAdhocPayments({ employee: employeeId }),
                    getReviews({ employee: employeeId })
                ]);

                const payments = paymentsRes.data || [];
                const reviews = reviewsRes.data || [];

                // Process History
                setBonusHistory(payments);

                // Calculate total "Bonus Points" (Sum of amounts)
                const total = payments.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                setTotalPoints(total);

                // Find latest completed review
                const latest = reviews.find(r => r.status?.toLowerCase() === 'completed') || reviews[0];
                setLatestReview(latest);

                // If we have a rating, calculate projected bonus
                if (latest && latest.overall_rating) {
                    try {
                        const projectionRes = await calculateBonus(latest.overall_rating);
                        setProjectedBonus(projectionRes.data);
                    } catch (projErr) {
                        console.error("Error fetching bonus projection:", projErr);
                    }
                }

                setError(null);
            } catch (err) {
                console.error("Error fetching bonus points data:", err);
                setError("This module is currently being configured or has no records to display.");
            } finally {
                setLoading(false);
            }
        };

        if (employeeId) {
            fetchData();
        }
    }, [employeeId]);

    const getRatingClass = (rating) => {
        if (!rating) return '';
        const r = parseFloat(rating);
        if (r >= 4.5) return 'rating-excellent';
        if (r >= 3.5) return 'rating-good';
        if (r >= 2.5) return 'rating-satisfactory';
        return 'rating-poor';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <p>Calculating bonus points...</p>
            </div>
        );
    }

    if (error && bonusHistory.length === 0) {
        return (
            <div className="empty-state">
                <Award size={48} />
                <h3>No Bonus Data</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bonus-points-container">
            <div className="bonus-header">
                <h2>Bonus Points & Rewards</h2>
            </div>

            {/* Summary Cards */}
            <div className="bonus-stats-grid">
                <div className="bonus-stat-card featured">
                    <div className="stat-icon">
                        <Coins size={24} />
                    </div>
                    <span className="stat-label">Total Earned Points</span>
                    <div className="stat-value points">
                        {totalPoints.toLocaleString()}
                    </div>
                    <span className="stat-subtitle">Lifetime performance rewards</span>
                </div>

                <div className="bonus-stat-card">
                    <div className="stat-icon">
                        <Star size={24} />
                    </div>
                    <span className="stat-label">Latest Rating</span>
                    <div className="stat-value">
                        {latestReview?.overall_rating || 'N/A'}
                        {latestReview?.overall_rating && (
                            <Star size={20} fill="#f59e0b" color="#f59e0b" />
                        )}
                    </div>
                    <span className="stat-subtitle">
                        {latestReview?.review_period_name || 'No recent reviews'}
                    </span>
                </div>

                <div className="bonus-stat-card">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <span className="stat-label">Bonuses Awarded</span>
                    <div className="stat-value">
                        {bonusHistory.length}
                    </div>
                    <span className="stat-subtitle">Number of performance payouts</span>
                </div>
            </div>

            {/* Projected Bonus Banner */}
            {projectedBonus && (
                <div className="bonus-prediction-banner">
                    <div className="stat-icon">
                        <Target size={24} />
                    </div>
                    <div className="prediction-info">
                        <h4>Performance Bonus Projection</h4>
                        <p>Based on your current rating of <strong>{latestReview.overall_rating}</strong></p>
                    </div>
                    <div className="prediction-value">
                        <span className="prediction-amount">
                            {projectedBonus.bonus_percentage}%
                        </span>
                        <span className="prediction-label">Next Cycle Potential</span>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bonus-section">
                <div className="section-title">
                    <History size={20} />
                    Award History
                </div>
                <div className="history-table-container">
                    {bonusHistory.length > 0 ? (
                        <table className="bonus-history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Award Name</th>
                                    <th>Point Value</th>
                                    <th>Reference</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bonusHistory.map(item => (
                                    <tr key={item.id}>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td>
                                            <div className="bonus-name">{item.name}</div>
                                            <span className="stat-subtitle">{item.remarks || 'Performance incentive'}</span>
                                        </td>
                                        <td>
                                            <div className="bonus-award-badge">
                                                <Coins size={12} />
                                                {parseFloat(item.amount).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>{item.payroll_period_name || 'Adhoc'}</td>
                                        <td>
                                            <span className={`rating-indicator ${item.status === 'processed' ? 'rating-excellent' : 'rating-satisfactory'}`}>
                                                {item.status === 'processed' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                {item.status === 'processed' ? 'Processed' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <History size={32} />
                            <p>No historical bonus awards found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileBonusPoints;
