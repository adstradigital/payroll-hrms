'use client';

import { useState, useEffect } from 'react';
import {
    Clock, Calendar, Save, Loader2, CheckCircle, AlertCircle,
    Settings, Coffee, Shield, Smartphone, MapPin, Info
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from '@/api/config';
import './WorkSchedulesSettings.css';

const daysOfWeek = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
];

export default function WorkSchedulesSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [policy, setPolicy] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        work_start_time: '09:00',
        work_end_time: '18:00',
        lunch_break_start: '13:00',
        lunch_break_end: '14:00',
        grace_period_minutes: 15,
        half_day_hours: 4.0,
        full_day_hours: 8.0,
        auto_mark_absent: true,
        require_checkout: true,
        allow_mobile_checkin: true,
        enable_geo_fencing: false,
        geo_fence_radius_meters: 100,
        enable_shift_system: true,
        track_break_time: true,
        allow_flexible_hours: false,
        overtime_after_minutes: 480,
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
                    name: activePolicy.name || '',
                    monday: activePolicy.monday,
                    tuesday: activePolicy.tuesday,
                    wednesday: activePolicy.wednesday,
                    thursday: activePolicy.thursday,
                    friday: activePolicy.friday,
                    saturday: activePolicy.saturday,
                    sunday: activePolicy.sunday,
                    work_start_time: activePolicy.work_start_time?.substring(0, 5) || '09:00',
                    work_end_time: activePolicy.work_end_time?.substring(0, 5) || '18:00',
                    lunch_break_start: activePolicy.lunch_break_start?.substring(0, 5) || '13:00',
                    lunch_break_end: activePolicy.lunch_break_end?.substring(0, 5) || '14:00',
                    grace_period_minutes: activePolicy.grace_period_minutes || 15,
                    half_day_hours: activePolicy.half_day_hours || 4.0,
                    full_day_hours: activePolicy.full_day_hours || 8.0,
                    auto_mark_absent: activePolicy.auto_mark_absent !== undefined ? activePolicy.auto_mark_absent : true,
                    require_checkout: activePolicy.require_checkout !== undefined ? activePolicy.require_checkout : true,
                    allow_mobile_checkin: activePolicy.allow_mobile_checkin !== undefined ? activePolicy.allow_mobile_checkin : true,
                    enable_geo_fencing: activePolicy.enable_geo_fencing || false,
                    geo_fence_radius_meters: activePolicy.geo_fence_radius_meters || 100,
                    enable_shift_system: activePolicy.enable_shift_system !== undefined ? activePolicy.enable_shift_system : true,
                    track_break_time: activePolicy.track_break_time !== undefined ? activePolicy.track_break_time : true,
                    allow_flexible_hours: activePolicy.allow_flexible_hours || false,
                    overtime_after_minutes: activePolicy.overtime_after_minutes || 480,
                });
            }
        } catch (error) {
            console.error('Error fetching policy:', error);
            showNotification('Failed to load company schedule settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const apiData = {
                ...formData,
                name: formData.name || 'Company Attendance Policy',
                policy_type: 'company',
                is_active: true,
                effective_from: new Date().toISOString().split('T')[0], // Simplified
                // Add :00 to time fields for API if needed
                work_start_time: formData.work_start_time + ':00',
                work_end_time: formData.work_end_time + ':00',
                lunch_break_start: formData.lunch_break_start + ':00',
                lunch_break_end: formData.lunch_break_end + ':00',
            };

            if (policy?.id) {
                await axiosInstance.patch(CLIENTADMIN_ENDPOINTS.ATTENDANCE_POLICY_DETAIL(policy.id), apiData);
            } else {
                const res = await axiosInstance.post(CLIENTADMIN_ENDPOINTS.ATTENDANCE_POLICIES, apiData);
                setPolicy(res.data);
            }

            showNotification('Schedule settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving policy:', error);
            showNotification('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="spin" size={40} />
                <p>Loading schedule settings...</p>
            </div>
        );
    }

    return (
        <div className="workschedules-settings">
            {notification && (
                <div className={`schedule-notification ${notification.type}`}>
                    {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </div>
            )}

            <div className="schedule-header">
                <h2>Organization Work Schedule</h2>
                <p>Define standard working days, hours, and attendance rules for your company</p>
            </div>

            <form onSubmit={handleSave}>
                {/* Working Days Card */}
                <div className="schedule-card">
                    <div className="schedule-card-header">
                        <Calendar size={20} />
                        <h3>Working Days</h3>
                    </div>
                    <div className="schedule-card-body">
                        <p className="field-hint">Select the days your organization is operational.</p>
                        <div className="days-container">
                            {daysOfWeek.map(day => (
                                <div key={day.key} className="day-toggle">
                                    <input
                                        type="checkbox"
                                        id={day.key}
                                        name={day.key}
                                        checked={formData[day.key]}
                                        onChange={handleChange}
                                        className="day-checkbox"
                                    />
                                    <label htmlFor={day.key} className="day-label">
                                        {day.label}
                                    </label>
                                    <span className="day-name">{day.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="schedule-grid">
                    {/* Standard Hours Card */}
                    <div className="schedule-card">
                        <div className="schedule-card-header">
                            <Clock size={20} />
                            <h3>Standard Working Hours</h3>
                        </div>
                        <div className="schedule-card-body">
                            <div className="schedule-section">
                                <h4>Work Timings</h4>
                                <div className="field-row">
                                    <div className="field-group">
                                        <label>Start Time</label>
                                        <input
                                            type="time"
                                            name="work_start_time"
                                            value={formData.work_start_time}
                                            onChange={handleChange}
                                            className="schedule-input"
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>End Time</label>
                                        <input
                                            type="time"
                                            name="work_end_time"
                                            value={formData.work_end_time}
                                            onChange={handleChange}
                                            className="schedule-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="schedule-section">
                                <h4>Lunch Break</h4>
                                <div className="field-row">
                                    <div className="field-group">
                                        <label>Break Start</label>
                                        <input
                                            type="time"
                                            name="lunch_break_start"
                                            value={formData.lunch_break_start}
                                            onChange={handleChange}
                                            className="schedule-input"
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Break End</label>
                                        <input
                                            type="time"
                                            name="lunch_break_end"
                                            value={formData.lunch_break_end}
                                            onChange={handleChange}
                                            className="schedule-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Policy Rules Card */}
                    <div className="schedule-card">
                        <div className="schedule-card-header">
                            <Shield size={20} />
                            <h3>Attendance Rules</h3>
                        </div>
                        <div className="schedule-card-body">
                            <div className="schedule-section">
                                <h4>Day Definitions</h4>
                                <div className="field-row">
                                    <div className="field-group">
                                        <label>Grace Period (min)</label>
                                        <input
                                            type="number"
                                            name="grace_period_minutes"
                                            value={formData.grace_period_minutes}
                                            onChange={handleChange}
                                            className="schedule-input"
                                            min="0"
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Half Day (hrs)</label>
                                        <input
                                            type="number"
                                            name="half_day_hours"
                                            value={formData.half_day_hours}
                                            onChange={handleChange}
                                            className="schedule-input"
                                            step="0.5"
                                            min="1"
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label>Full Day (hrs)</label>
                                        <input
                                            type="number"
                                            name="full_day_hours"
                                            value={formData.full_day_hours}
                                            onChange={handleChange}
                                            className="schedule-input"
                                            step="0.5"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="schedule-section">
                                <h4>System Controls</h4>
                                <div className="toggle-group">
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span>Mobile Check-in</span>
                                            <span>Allow clock-in via mobile app</span>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                name="allow_mobile_checkin"
                                                checked={formData.allow_mobile_checkin}
                                                onChange={handleChange}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span>Geo-Fencing</span>
                                            <span>Restrict check-in to office location</span>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                name="enable_geo_fencing"
                                                checked={formData.enable_geo_fencing}
                                                onChange={handleChange}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span>Enable Shift System</span>
                                            <span>Allow multiple work shifts for employees</span>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                name="enable_shift_system"
                                                checked={formData.enable_shift_system}
                                                onChange={handleChange}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <span>Auto-Mark Absent</span>
                                            <span>Mark absent if no check-in</span>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                name="auto_mark_absent"
                                                checked={formData.auto_mark_absent}
                                                onChange={handleChange}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-footer">
                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Work Schedule'}
                    </button>
                </div>
            </form>
        </div>
    );
}
