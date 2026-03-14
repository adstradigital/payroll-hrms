'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Building2,
    Phone,
    MapPin,
    SlidersHorizontal,
    Save,
    RotateCcw,
    Check,
    AlertCircle,
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

const EMPTY_FORM = Object.freeze({
    // Company Details
    company_name: '',
    company_code: '',
    industry: '',
    company_size: '',
    founded_year: '',

    // Contact Information
    email: '',
    phone: '',
    website: '',
    support_email: '',

    // Address
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',

    // System Configuration
    timezone: '',
    currency: '',
    date_format: '',
    time_format: '',
    payroll_cycle: '',
});

function asString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

function getYearFromDateString(value) {
    const text = asString(value).trim();
    const match = text.match(/^(\d{4})/);
    return match ? match[1] : '';
}

function buildAddress(line1, line2) {
    const a1 = asString(line1).trim();
    const a2 = asString(line2).trim();
    if (!a1 && !a2) return '';
    if (!a2) return a1;
    if (!a1) return a2;
    return `${a1}\n${a2}`;
}

function diffFields(current, initial) {
    const changed = {};
    for (const key of Object.keys(EMPTY_FORM)) {
        if (asString(current?.[key]) !== asString(initial?.[key])) {
            changed[key] = current?.[key];
        }
    }
    return changed;
}

export default function CompanyInfoSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const initialRef = useRef(EMPTY_FORM);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        let isMounted = true;

        const fetchOrganization = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get('/account/organization/');
                const org = response.data?.organization || {};
                const settings = org?.settings || {};

                const nextForm = {
                    ...EMPTY_FORM,

                    company_name: asString(settings?.company_name ?? org?.company_name ?? org?.name),
                    company_code: asString(settings?.company_code ?? org?.company_code ?? org?.code),
                    industry: asString(settings?.industry ?? org?.industry),
                    company_size: asString(settings?.company_size ?? org?.company_size ?? org?.employee_scale),
                    founded_year: asString(
                        settings?.founded_year ?? org?.founded_year ?? getYearFromDateString(org?.established_date)
                    ),

                    email: asString(settings?.email ?? org?.email),
                    phone: asString(settings?.phone ?? org?.phone),
                    website: asString(settings?.website ?? org?.website),
                    support_email: asString(settings?.support_email),

                    address_line1: asString(settings?.address_line1 ?? org?.address),
                    address_line2: asString(settings?.address_line2),
                    city: asString(settings?.city ?? org?.city),
                    state: asString(settings?.state ?? org?.state),
                    country: asString(settings?.country ?? org?.country),
                    postal_code: asString(settings?.postal_code ?? org?.postal_code ?? org?.pincode),

                    timezone: asString(settings?.timezone ?? org?.timezone),
                    currency: asString(settings?.currency ?? org?.currency),
                    date_format: asString(settings?.date_format ?? org?.date_format),
                    time_format: asString(settings?.time_format ?? org?.time_format),
                    payroll_cycle: asString(settings?.payroll_cycle ?? org?.payroll_cycle),
                };

                if (!isMounted) return;
                initialRef.current = nextForm;
                setForm(nextForm);
            } catch (error) {
                console.error('Failed to load organization details:', error);
                if (isMounted) {
                    initialRef.current = EMPTY_FORM;
                    setForm(EMPTY_FORM);
                    showNotification('Failed to load company info', 'error');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchOrganization();
        return () => {
            isMounted = false;
        };
    }, []);

    const hasChanges = Object.keys(diffFields(form, initialRef.current)).length > 0;

    const onChange = (key) => (e) => {
        const value = e?.target?.value ?? '';
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setForm(initialRef.current);
        showNotification('Changes reset', 'success');
    };

    const buildUpdatePayload = (changed) => {
        const payload = {};
        const settings = {};

        const setIf = (k, v) => {
            settings[k] = v;
        };

        // Company Details
        if ('company_name' in changed) {
            payload.name = asString(form.company_name);
            setIf('company_name', asString(form.company_name));
        }
        if ('industry' in changed) {
            payload.industry = asString(form.industry);
            setIf('industry', asString(form.industry));
        }
        if ('company_code' in changed) setIf('company_code', asString(form.company_code));
        if ('company_size' in changed) setIf('company_size', asString(form.company_size));
        if ('founded_year' in changed) {
            const year = asString(form.founded_year).trim();
            setIf('founded_year', year ? year : null);
        }

        // Contact Information
        if ('email' in changed) payload.email = asString(form.email);
        if ('phone' in changed) payload.phone = asString(form.phone);
        if ('website' in changed) payload.website = asString(form.website);
        if ('support_email' in changed) setIf('support_email', asString(form.support_email));

        // Address (top-level + settings for line1/line2)
        const addressChanged = 'address_line1' in changed || 'address_line2' in changed;
        if (addressChanged) {
            payload.address = buildAddress(form.address_line1, form.address_line2);
            if ('address_line1' in changed) setIf('address_line1', asString(form.address_line1));
            if ('address_line2' in changed) setIf('address_line2', asString(form.address_line2));
        }
        if ('city' in changed) payload.city = asString(form.city);
        if ('state' in changed) payload.state = asString(form.state);
        if ('country' in changed) payload.country = asString(form.country);
        if ('postal_code' in changed) payload.pincode = asString(form.postal_code);

        // System Configuration (settings)
        if ('timezone' in changed) setIf('timezone', asString(form.timezone));
        if ('currency' in changed) setIf('currency', asString(form.currency));
        if ('date_format' in changed) setIf('date_format', asString(form.date_format));
        if ('time_format' in changed) setIf('time_format', asString(form.time_format));
        if ('payroll_cycle' in changed) setIf('payroll_cycle', asString(form.payroll_cycle));

        if (Object.keys(settings).length > 0) payload.settings = settings;
        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const changed = diffFields(form, initialRef.current);
        if (Object.keys(changed).length === 0) {
            showNotification('No changes to save', 'success');
            return;
        }

        const payload = buildUpdatePayload(changed);

        try {
            setSaving(true);
            try {
                await axiosInstance.put('/account/organization/', payload);
            } catch (error) {
                if (error?.response?.status === 405) {
                    await axiosInstance.patch('/account/organization/', payload);
                } else {
                    throw error;
                }
            }
            initialRef.current = { ...form };
            showNotification('Company info saved', 'success');
        } catch (error) {
            console.error('Failed to save company info:', error);
            showNotification(error?.response?.data?.error || 'Failed to save company info', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading company info...</div>;
    }

    return (
        <div className="settings-panel">
            {notification && (
                <div className={`settings-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="settings-panel-header">
                <h2>Company Info</h2>
                <p>Manage your organization details, contact information, and system defaults</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Company Details */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <Building2 size={18} />
                        <h3>Company Details</h3>
                    </div>
                    <div className="settings-card-body">
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Company Name</label>
                                <input
                                    className="settings-input"
                                    value={form.company_name}
                                    onChange={onChange('company_name')}
                                    placeholder="e.g. Acme Corporation"
                                />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Company Code</label>
                                <input
                                    className="settings-input"
                                    value={form.company_code}
                                    onChange={onChange('company_code')}
                                    placeholder="e.g. ACME"
                                />
                            </div>
                        </div>
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Industry</label>
                                <input
                                    className="settings-input"
                                    value={form.industry}
                                    onChange={onChange('industry')}
                                    placeholder="e.g. Manufacturing"
                                />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Company Size</label>
                                <input
                                    className="settings-input"
                                    list="company-sizes"
                                    value={form.company_size}
                                    onChange={onChange('company_size')}
                                    placeholder="e.g. 51-200"
                                />
                                <datalist id="company-sizes">
                                    <option value="1-50" />
                                    <option value="51-200" />
                                    <option value="201-500" />
                                    <option value="501-1000" />
                                    <option value="1000+" />
                                </datalist>
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Founded Year</label>
                                <input
                                    className="settings-input"
                                    inputMode="numeric"
                                    pattern="\\d{4}"
                                    value={form.founded_year}
                                    onChange={onChange('founded_year')}
                                    placeholder="e.g. 2015"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <Phone size={18} />
                        <h3>Contact Information</h3>
                    </div>
                    <div className="settings-card-body">
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Email</label>
                                <input
                                    className="settings-input"
                                    type="email"
                                    value={form.email}
                                    onChange={onChange('email')}
                                    placeholder="e.g. hello@acme.com"
                                />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Phone</label>
                                <input
                                    className="settings-input"
                                    type="tel"
                                    value={form.phone}
                                    onChange={onChange('phone')}
                                    placeholder="e.g. +91XXXXXXXXXX"
                                />
                            </div>
                        </div>
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Website</label>
                                <input
                                    className="settings-input"
                                    type="url"
                                    value={form.website}
                                    onChange={onChange('website')}
                                    placeholder="e.g. https://acme.com"
                                />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Support Email</label>
                                <input
                                    className="settings-input"
                                    type="email"
                                    value={form.support_email}
                                    onChange={onChange('support_email')}
                                    placeholder="e.g. support@acme.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <MapPin size={18} />
                        <h3>Address</h3>
                    </div>
                    <div className="settings-card-body">
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Address Line 1</label>
                                <input
                                    className="settings-input"
                                    value={form.address_line1}
                                    onChange={onChange('address_line1')}
                                    placeholder="Street, building, area"
                                />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Address Line 2</label>
                                <input
                                    className="settings-input"
                                    value={form.address_line2}
                                    onChange={onChange('address_line2')}
                                    placeholder="Apartment, suite, landmark (optional)"
                                />
                            </div>
                        </div>
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">City</label>
                                <input className="settings-input" value={form.city} onChange={onChange('city')} />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">State</label>
                                <input className="settings-input" value={form.state} onChange={onChange('state')} />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Country</label>
                                <input className="settings-input" value={form.country} onChange={onChange('country')} />
                            </div>
                        </div>
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Postal Code</label>
                                <input
                                    className="settings-input"
                                    value={form.postal_code}
                                    onChange={onChange('postal_code')}
                                    placeholder="e.g. 560001"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Configuration */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <SlidersHorizontal size={18} />
                        <h3>System Configuration</h3>
                    </div>
                    <div className="settings-card-body">
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Timezone</label>
                                <input
                                    className="settings-input"
                                    list="timezones"
                                    value={form.timezone}
                                    onChange={onChange('timezone')}
                                    placeholder="e.g. Asia/Kolkata"
                                />
                                <datalist id="timezones">
                                    <option value="Asia/Kolkata" />
                                    <option value="UTC" />
                                    <option value="America/New_York" />
                                    <option value="Europe/London" />
                                </datalist>
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Currency</label>
                                <input
                                    className="settings-input"
                                    list="currencies"
                                    value={form.currency}
                                    onChange={onChange('currency')}
                                    placeholder="e.g. INR"
                                />
                                <datalist id="currencies">
                                    <option value="INR" />
                                    <option value="USD" />
                                    <option value="EUR" />
                                    <option value="GBP" />
                                </datalist>
                            </div>
                        </div>
                        <div className="settings-input-row">
                            <div className="settings-field-group">
                                <label className="settings-label">Date Format</label>
                                <input
                                    className="settings-input"
                                    list="date-formats"
                                    value={form.date_format}
                                    onChange={onChange('date_format')}
                                    placeholder="e.g. YYYY-MM-DD"
                                />
                                <datalist id="date-formats">
                                    <option value="YYYY-MM-DD" />
                                    <option value="DD-MM-YYYY" />
                                    <option value="MM/DD/YYYY" />
                                </datalist>
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Time Format</label>
                                <input
                                    className="settings-input"
                                    list="time-formats"
                                    value={form.time_format}
                                    onChange={onChange('time_format')}
                                    placeholder="e.g. 24h"
                                />
                                <datalist id="time-formats">
                                    <option value="24h" />
                                    <option value="12h" />
                                    <option value="HH:mm" />
                                    <option value="hh:mm A" />
                                </datalist>
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Payroll Cycle</label>
                                <input
                                    className="settings-input"
                                    list="payroll-cycles"
                                    value={form.payroll_cycle}
                                    onChange={onChange('payroll_cycle')}
                                    placeholder="e.g. Monthly"
                                />
                                <datalist id="payroll-cycles">
                                    <option value="Monthly" />
                                    <option value="Bi-Weekly" />
                                    <option value="Weekly" />
                                </datalist>
                            </div>
                        </div>
                    </div>
                    <div className="settings-card-footer">
                        <button
                            type="button"
                            className="settings-btn-secondary"
                            onClick={handleReset}
                            disabled={saving || !hasChanges}
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                        <button type="submit" className="settings-btn-primary" disabled={saving || !hasChanges}>
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
