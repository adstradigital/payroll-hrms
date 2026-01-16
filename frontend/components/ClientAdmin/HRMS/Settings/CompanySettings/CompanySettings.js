'use client';

import { useState } from 'react';
import { Building2, Mail, Phone, MapPin, Globe, Save } from 'lucide-react';
import './CompanySettings.css';

export default function CompanySettings() {
    const [formData, setFormData] = useState({
        companyName: 'HR Nexus Technologies',
        email: 'contact@hrnexus.com',
        phone: '+91 98765 43210',
        website: 'www.hrnexus.com',
        address: '123 Business Park, Mumbai, India',
        gstin: '27AADCB2230M1ZS',
        pan: 'AADCB2230M',
        registrationNo: 'U74999MH2020PTC123456',
        workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        workStartTime: '09:00',
        workEndTime: '18:00',
        timezone: 'Asia/Kolkata',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        // TODO: API call to save settings
        alert('Settings saved successfully!');
    };

    return (
        <div className="company-settings">
            <div className="settings-header">
                <h2 className="settings-title">Company Settings</h2>
                <button className="btn btn-primary" onClick={handleSave}>
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            <div className="settings-sections">
                {/* Basic Info */}
                <div className="settings-section">
                    <h3 className="section-title">Basic Information</h3>
                    <div className="settings-grid">
                        <div className="form-field">
                            <label>Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label>Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label>Website</label>
                            <input type="url" name="website" value={formData.website} onChange={handleChange} />
                        </div>
                        <div className="form-field form-field--full">
                            <label>Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows={2} />
                        </div>
                    </div>
                </div>

                {/* Legal Info */}
                <div className="settings-section">
                    <h3 className="section-title">Legal Information</h3>
                    <div className="settings-grid">
                        <div className="form-field">
                            <label>GSTIN</label>
                            <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label>PAN</label>
                            <input type="text" name="pan" value={formData.pan} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label>Registration No</label>
                            <input type="text" name="registrationNo" value={formData.registrationNo} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Work Schedule */}
                <div className="settings-section">
                    <h3 className="section-title">Work Schedule</h3>
                    <div className="settings-grid">
                        <div className="form-field">
                            <label>Work Start Time</label>
                            <input type="time" name="workStartTime" value={formData.workStartTime} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label>Work End Time</label>
                            <input type="time" name="workEndTime" value={formData.workEndTime} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label>Timezone</label>
                            <select name="timezone" value={formData.timezone} onChange={handleChange}>
                                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                <option value="America/New_York">America/New_York (EST)</option>
                                <option value="Europe/London">Europe/London (GMT)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
