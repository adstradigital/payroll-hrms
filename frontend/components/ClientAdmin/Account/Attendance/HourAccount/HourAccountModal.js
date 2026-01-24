'use client';

import { X } from 'lucide-react';
import './HourAccountModal.css';

export default function HourAccountModal({ isOpen, onClose, onSave }) {
    if (!isOpen) return null;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave();
    };

    return (
        <div className="ham-overlay" onClick={(e) => {
            if (e.target.classList && e.target.classList.contains('ham-overlay')) onClose();
        }}>
            <div className="ham-content">
                <div className="ham-header">
                    <h2 className="ham-title">Hour Account</h2>
                    <button className="ham-close" onClick={onClose} aria-label="Close modal">
                        <X size={24} />
                    </button>
                </div>

                <div className="ham-body">
                    <form className="ham-form-grid" onSubmit={handleSubmit}>
                        <div className="ham-group">
                            <label className="ham-label">Employee *</label>
                            <select className="ham-select">
                                <option>Adam Luis (PEP00)</option>
                                <option>Ankit Pokhrel (PEP0003)</option>
                                <option>Ahmed Omer (PEP0004)</option>
                            </select>
                        </div>

                        <div className="ham-group">
                            <label className="ham-label">Month *</label>
                            <select className="ham-select">
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="ham-group">
                            <label className="ham-label">Year *</label>
                            <input type="text" className="ham-input" defaultValue="2026" />
                        </div>

                        <div className="ham-group">
                            <label className="ham-label">Worked Hours *</label>
                            <input type="text" className="ham-input" placeholder="00:00" />
                        </div>

                        <div className="ham-group">
                            <label className="ham-label">Pending Hours *</label>
                            <input type="text" className="ham-input" placeholder="00:00" />
                        </div>

                        <div className="ham-group">
                            <label className="ham-label">Overtime *</label>
                            <input type="text" className="ham-input" placeholder="00:00" />
                        </div>

                        {/* Hidden submit button to allow Enter key submission */}
                        <button type="submit" style={{ display: 'none' }}></button>
                    </form>
                </div>

                <div className="ham-footer">
                    <button className="ham-save-btn" onClick={handleSubmit}>Save</button>
                </div>
            </div>
        </div>
    );
}
