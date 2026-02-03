'use client';

import { useState, useEffect } from 'react';
import {
    Clock, Calendar, Save, Loader2, CheckCircle, AlertCircle,
    Settings, Coffee, Shield, Info, Hourglass, Zap
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from '@/api/config';
import './OverTimeSettings.css';

export default function OverTimeSettings({ standalone = true }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [policy, setPolicy] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        overtime_applicable: true,
        overtime_rate_multiplier: 1.5,
        weekend_overtime_multiplier: 2.0,
        holiday_overtime_multiplier: 2.5,
        max_overtime_per_day: 4,
        max_overtime_per_week: 20,
        require_overtime_pre_approval: false,
        min_overtime_minutes: 30,
        overtime_after_minutes: 480
    });

    useEffect(() => {
        fetchPolicy();
    }, []);

    const fetchPolicy = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.ATTENDANCE_POLICIES);
            const policies = response.data.results || response.data || [];

            // Find active company policy
            const activePolicy = policies.find(p => p.is_active && p.policy_type === 'company');

            if (activePolicy) {
                setPolicy(activePolicy);
                setFormData({
                    overtime_applicable: activePolicy.overtime_applicable,
                    overtime_rate_multiplier: activePolicy.overtime_rate_multiplier || 1.5,
                    weekend_overtime_multiplier: activePolicy.weekend_overtime_multiplier || 2.0,
                    holiday_overtime_multiplier: activePolicy.holiday_overtime_multiplier || 2.5,
                    max_overtime_per_day: activePolicy.max_overtime_per_day || 4,
                    max_overtime_per_week: activePolicy.max_overtime_per_week || 20,
                    require_overtime_pre_approval: activePolicy.require_overtime_pre_approval || false,
                    min_overtime_minutes: activePolicy.min_overtime_minutes || 30,
                    overtime_after_minutes: activePolicy.overtime_after_minutes || 480
                });
            }
        } catch (error) {
            console.error('Error fetching policy:', error);
            showNotification('Failed to load overtime settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!policy) return;

        try {
            setSaving(true);
            await axiosInstance.patch(`${CLIENTADMIN_ENDPOINTS.ATTENDANCE_POLICIES}${policy.id}/`, formData);
            showNotification('Overtime rules updated successfully', 'success');
        } catch (error) {
            console.error('Error updating overtime settings:', error);
            showNotification('Failed to update overtime settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '400px', flexDirection: 'column', gap: '1rem' }}>
                <Loader2 className="spin" size={40} color="var(--brand-primary)" />
                <p style={{ color: 'var(--text-secondary)' }}>Loading Overtime Rules...</p>
            </div>
        );
    }

    return (
        <div className={standalone ? "overtime-settings animate-fade-in" : "overtime-embedded animate-fade-in"}>
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {notification.message}
                </div>
            )}

            {standalone && (
                <div className="overtime-header">
                    <div>
                        <h2>Overtime Rules</h2>
                        <p>Configure how overtime is calculated, approved, and compensated</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="overtime-toggle-row">
                    <div className="toggle-info">
                        <span className="toggle-label">Enable Overtime Tracking</span>
                        <span className="toggle-desc">Calculate and track overtime hours automatically</span>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            name="overtime_applicable"
                            checked={formData.overtime_applicable}
                            onChange={handleChange}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                {formData.overtime_applicable && (
                    <div className="overtime-content">
                        {/* Rate Multipliers */}
                        <div className="overtime-card">
                            <div className="overtime-card-header">
                                <Zap size={18} color="var(--brand-primary)" />
                                <h3>Rate Multipliers</h3>
                            </div>
                            <div className="overtime-card-body">
                                <div className="overtime-grid">
                                    <div className="overtime-field">
                                        <label>Regular OT Multiplier</label>
                                        <input
                                            type="number"
                                            name="overtime_rate_multiplier"
                                            value={formData.overtime_rate_multiplier}
                                            onChange={handleChange}
                                            className="overtime-input"
                                            step="0.1"
                                            min="1"
                                        />
                                        <span className="field-hint">Multiplier for regular working days</span>
                                    </div>
                                    <div className="overtime-field">
                                        <label>Weekend OT Multiplier</label>
                                        <input
                                            type="number"
                                            name="weekend_overtime_multiplier"
                                            value={formData.weekend_overtime_multiplier}
                                            onChange={handleChange}
                                            className="overtime-input"
                                            step="0.1"
                                            min="1"
                                        />
                                        <span className="field-hint">Multiplier for Saturdays and Sundays</span>
                                    </div>
                                    <div className="overtime-field">
                                        <label>Holiday OT Multiplier</label>
                                        <input
                                            type="number"
                                            name="holiday_overtime_multiplier"
                                            value={formData.holiday_overtime_multiplier}
                                            onChange={handleChange}
                                            className="overtime-input"
                                            step="0.1"
                                            min="1"
                                        />
                                        <span className="field-hint">Multiplier for Public Holidays</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Limits & Thresholds */}
                        <div className="overtime-card">
                            <div className="overtime-card-header">
                                <Hourglass size={18} color="var(--brand-primary)" />
                                <h3>Limits & Thresholds</h3>
                            </div>
                            <div className="overtime-card-body">
                                <div className="overtime-grid">
                                    <div className="overtime-field">
                                        <label>OT Starts After (minutes)</label>
                                        <input
                                            type="number"
                                            name="overtime_after_minutes"
                                            value={formData.overtime_after_minutes}
                                            onChange={handleChange}
                                            className="overtime-input"
                                            min="0"
                                        />
                                        <span className="field-hint">Minutes worked after regular shift</span>
                                    </div>
                                    <div className="overtime-field">
                                        <label>Min Session Duration (min)</label>
                                        <input
                                            type="number"
                                            name="min_overtime_minutes"
                                            value={formData.min_overtime_minutes}
                                            onChange={handleChange}
                                            className="overtime-input"
                                            min="0"
                                        />
                                        <span className="field-hint">Min minutes to qualify for OT pay</span>
                                    </div>
                                    <div className="overtime-field">
                                        <label>Max OT Per Day (hours)</label>
                                        <input
                                            type="number"
                                            name="max_overtime_per_day"
                                            value={formData.max_overtime_per_day}
                                            onChange={handleChange}
                                            className="overtime-input"
                                            min="1"
                                        />
                                        <span className="field-hint">Cap on daily overtime hours</span>
                                    </div>
                                    <div className="overtime-field">
                                        <label>Max OT Per Week (hours)</label>
                                        <input
                                            type="number"
                                            name="max_overtime_per_week"
                                            value={formData.max_overtime_per_week}
                                            onChange={handleChange}
                                            className="overtime-input"
                                            min="1"
                                        />
                                        <span className="field-hint">Cap on weekly overtime hours</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Approvals */}
                        <div className="overtime-card">
                            <div className="overtime-card-header">
                                <Shield size={18} color="var(--brand-primary)" />
                                <h3>Approval Workflow</h3>
                            </div>
                            <div className="overtime-card-body">
                                <div className="overtime-toggle-row" style={{ margin: 0, padding: 0, background: 'none' }}>
                                    <div className="toggle-info">
                                        <span className="toggle-label">Require Pre-Approval</span>
                                        <span className="toggle-desc">Managers must approve overtime before it counts</span>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            name="require_overtime_pre_approval"
                                            checked={formData.require_overtime_pre_approval}
                                            onChange={handleChange}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card-footer" style={{ background: 'none', border: 'none', padding: '1rem 0' }}>
                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                        {saving ? 'Updating...' : 'Save Overtime Rules'}
                    </button>
                </div>
            </form>
        </div>
    );
}
