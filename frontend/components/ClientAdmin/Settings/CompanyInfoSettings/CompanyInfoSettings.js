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
    Upload,
    Trash2,
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
    currency: '',
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
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
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

                    company_name: asString(org?.company_name ?? org?.name ?? settings?.company_name),
                    company_code: asString(org?.company_code ?? org?.code ?? settings?.company_code),
                    industry: asString(org?.industry ?? settings?.industry),
                    company_size: asString(org?.company_size ?? org?.employee_scale ?? settings?.company_size),
                    founded_year: asString(
                        getYearFromDateString(org?.established_date) ?? org?.founded_year ?? settings?.founded_year
                    ),

                    email: asString(org?.email ?? settings?.email),
                    phone: asString(org?.phone ?? settings?.phone),
                    website: asString(org?.website ?? settings?.website),
                    support_email: asString(settings?.support_email),

                    address_line1: asString(org?.address?.split('\n')[0] ?? settings?.address_line1),
                    address_line2: asString(org?.address?.split('\n')[1] ?? settings?.address_line2),
                    city: asString(org?.city ?? settings?.city),
                    state: asString(org?.state ?? settings?.state),
                    country: asString(org?.country ?? settings?.country),
                    postal_code: asString(org?.pincode ?? org?.postal_code ?? settings?.postal_code),

                    currency: asString(org?.currency ?? settings?.currency),
                    payroll_cycle: asString(org?.payroll_cycle ?? settings?.payroll_cycle),
                };

                if (org?.logo) {
                    setLogoPreview(org.logo);
                }

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
        setLogoFile(null);
        setLogoPreview(initialRef.current.logo || null);
        showNotification('Changes reset', 'success');
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Logo must be less than 2MB', 'error');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
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
            payload.established_date = year ? `${year}-01-01` : null;
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
        if ('currency' in changed) setIf('currency', asString(form.currency));
        if ('payroll_cycle' in changed) setIf('payroll_cycle', asString(form.payroll_cycle));

        if (Object.keys(settings).length > 0) payload.settings = JSON.stringify(settings);
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
        const formData = new FormData();

        // Add regular fields
        Object.keys(payload).forEach(key => {
            if (key === 'settings') {
                formData.append(key, payload[key]);
            } else {
                formData.append(key, payload[key]);
            }
        });

        // Add logo if changed
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        try {
            setSaving(true);
            try {
                await axiosInstance.patch('/account/organization/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } catch (error) {
                showNotification(error?.response?.data?.error || 'Failed to save company info', 'error');
                throw error;
            }
            initialRef.current = { ...form };
            setLogoFile(null);
            showNotification('Company info saved', 'success');
        } catch (error) {
            console.error('Failed to save company info:', error);
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
                        <div className="settings-logo-section">
                            <div className="settings-logo-preview">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Company Logo" />
                                ) : (
                                    <Building2 size={32} className="text-gray-300" />
                                )}
                            </div>
                            <div className="settings-logo-actions">
                                <label className="settings-btn-logo">
                                    <Upload size={14} />
                                    Change Logo
                                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                                </label>
                                <p className="text-xs text-gray-400 mt-1">
                                    Recommended: Square image, max 2MB.
                                </p>
                            </div>
                        </div>

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
