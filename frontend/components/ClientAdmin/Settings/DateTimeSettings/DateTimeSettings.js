'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Globe, Save, Check, AlertCircle } from 'lucide-react';
import { getOrganization, updateOrganizationSettings } from '@/api/api_clientadmin';
import './DateTimeSettings.css';

const DATE_FORMATS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 31/12/2023)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 12/31/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2023-12-31)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (e.g. 31-12-2023)' },
    { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (e.g. Dec 31, 2023)' }
];

const TIME_FORMATS = [
    { value: '12h', label: '12-hour (e.g. 02:30 PM)' },
    { value: '24h', label: '24-hour (e.g. 14:30)' }
];

const TIMEZONES = [
    { value: 'UTC', label: '(UTC) Coordinated Universal Time' },
    { value: 'Asia/Kolkata', label: '(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi' },
    { value: 'America/New_York', label: '(GMT-5:00) Eastern Time (US & Canada)' },
    { value: 'Europe/London', label: '(GMT+0:00) London, Edinburgh, Dublin, Lisbon' },
    { value: 'Asia/Dubai', label: '(GMT+4:00) Abu Dhabi, Muscat' },
    { value: 'Asia/Singapore', label: '(GMT+8:00) Beijing, Perth, Singapore, Hong Kong' },
    { value: 'Australia/Sydney', label: '(GMT+11:00) Canberra, Melbourne, Sydney' }
];

export default function DateTimeSettings() {
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // State for formats
    const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
    const [timeFormat, setTimeFormat] = useState('12h');
    const [timezone, setTimezone] = useState('UTC');
    const [weekStart, setWeekStart] = useState('Monday');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await getOrganization();
            if (response.data?.success) {
                const settings = response.data.organization?.settings || {};
                setDateFormat(settings.date_format || 'DD/MM/YYYY');
                setTimeFormat(settings.time_format || '12h');
                setTimezone(settings.timezone || 'UTC');
                setWeekStart(settings.week_start || 'Monday');
            }
        } catch (error) {
            console.error('Error fetching date time settings:', error);
            showNotification('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const settingsPayload = {
                date_format: dateFormat,
                time_format: timeFormat,
                timezone: timezone,
                week_start: weekStart
            };

            const response = await updateOrganizationSettings(settingsPayload);
            if (response.data?.success) {
                showNotification('Date and Time settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save date time settings:', error);
            showNotification('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-panel">
                <div className="settings-card">
                    <div className="placeholder-content">
                        <Clock className="animate-spin" size={24} />
                        <p>Loading settings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="date-time-settings">
            {notification && (
                <div className={`dt-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="dt-header">
                <h2>Date & Time Format</h2>
                <p>Configure how dates and times are displayed across the platform</p>
            </div>

            <div className="dt-card">
                <div className="dt-card-header">
                    <Calendar size={18} />
                    <h3>Display Formats</h3>
                </div>
                <div className="dt-card-body">
                    <div className="dt-field">
                        <label>Date Format</label>
                        <select 
                            className="dt-select"
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                        >
                            {DATE_FORMATS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                        <p className="dt-hint">Standard date representation for reports and lists</p>
                    </div>

                    <div className="dt-field">
                        <label>Time Format</label>
                        <select 
                            className="dt-select"
                            value={timeFormat}
                            onChange={(e) => setTimeFormat(e.target.value)}
                        >
                            {TIME_FORMATS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                        <p className="dt-hint">Choose between 12-hour (AM/PM) or 24-hour clock</p>
                    </div>
                </div>
            </div>

            <div className="dt-card">
                <div className="dt-card-header">
                    <Globe size={18} />
                    <h3>Regional Settings</h3>
                </div>
                <div className="dt-card-body">
                    <div className="dt-field">
                        <label>Timezone</label>
                        <select 
                            className="dt-select"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                        >
                            {TIMEZONES.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                        <p className="dt-hint">Default timezone for calculating attendance and shifts</p>
                    </div>

                    <div className="dt-field">
                        <label>First day of the week</label>
                        <select 
                            className="dt-select"
                            value={weekStart}
                            onChange={(e) => setWeekStart(e.target.value)}
                        >
                            <option value="Monday">Monday</option>
                            <option value="Sunday">Sunday</option>
                        </select>
                        <p className="dt-hint">Used for weekly reports and calendar views</p>
                    </div>
                </div>
                <div className="dt-card-footer">
                    <button 
                        className="dt-btn-primary" 
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
