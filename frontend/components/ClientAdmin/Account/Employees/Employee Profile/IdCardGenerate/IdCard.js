'use client';

import { useState, useRef } from 'react';
import { X, Printer, Download, Mail, Phone, MapPin, ShieldCheck, QrCode, RotateCw, Info } from 'lucide-react';
import './IdCard.css';

export default function IdCard({ employee, onClose }) {
    const [selectedTemplate, setSelectedTemplate] = useState('modern'); // 'modern', 'corporate', 'minimal'
    const [isFlipped, setIsFlipped] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const printRef = useRef();

    const handlePrint = () => {
        window.print();
    };

    const emp = {
        name: employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee Name',
        role: employee.designation_name || employee.designation?.name || 'Graphic Designer',
        id: employee.employee_id || 'ID-0000000',
        email: employee.email || 'email@company.com',
        phone: employee.phone || '000-000-0000',
        blood: employee.blood_group || 'O+',
        joined: employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : '01/01/2024',
        expiry: '12/31/2025',
        org: employee.company?.name || 'ACME CORP',
        tagline: 'Innovating Future'
    };

    // --- TEMPLATE RENDERERS ---
    // ... (renderers remain same)

    const renderModern = () => (
        <div className="id-card-face template-modern">
            <div className="v2-header">
                <div className="v2-org-info">
                    <h2>{emp.org}</h2>
                    <p>{emp.tagline}</p>
                </div>
                <div className="v2-header-shape"></div>
            </div>

            <div className="v2-profile-area">
                <div className="v2-photo-ring">
                    <div className="v2-photo">
                        {emp.name.split(' ').map(n => n?.[0]).join('')}
                    </div>
                </div>
                <h2 className="v2-emp-name">{emp.name}</h2>
                <p className="v2-emp-role">{emp.role}</p>
            </div>

            <div className="v2-info-grid">
                <div className="v2-info-row"><span className="v2-label">ID No</span><span className="v2-sep">:</span><span className="v2-val">{emp.id}</span></div>
                <div className="v2-info-row"><span className="v2-label">Blood</span><span className="v2-sep">:</span><span className="v2-val">{emp.blood}</span></div>
                <div className="v2-info-row"><span className="v2-label">Email</span><span className="v2-sep">:</span><span className="v2-val">{emp.email}</span></div>
                <div className="v2-info-row"><span className="v2-label">Phone</span><span className="v2-sep">:</span><span className="v2-val">{emp.phone}</span></div>
            </div>

            <div className="v2-footer">
                <div className="v2-barcode">
                    <div className="barcode-bars"></div>
                    <span>{emp.id}</span>
                </div>
                <div className="v2-footer-accent"></div>
            </div>
        </div>
    );

    const renderCorporate = () => (
        <div className="id-card-face template-corporate">
            <div className="t-corp-header">
                <div className="t-corp-logo">{emp.org}</div>
                <div className="t-corp-chip"></div>
            </div>
            <div className="t-corp-body">
                <div className="t-corp-photo">
                    <div className="t-corp-photo-inner">
                        {emp.name.charAt(0)}
                    </div>
                </div>
                <div className="t-corp-details">
                    <h2 className="t-corp-name">{emp.name}</h2>
                    <p className="t-corp-role">{emp.role}</p>
                    <div className="t-corp-grid">
                        <div className="t-corp-field"><h4>ID Number</h4><p>{emp.id}</p></div>
                        <div className="t-corp-field"><h4>Joined</h4><p>{emp.joined}</p></div>
                        <div className="t-corp-field"><h4>Department</h4><p>Engineering</p></div>
                        <div className="t-corp-field"><h4>Blood Grp</h4><p>{emp.blood}</p></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMinimal = () => (
        <div className="id-card-face template-minimal">
            <div className="t-min-header">
                <div className="t-min-logo">{emp.org}</div>
                <div className="t-min-qr"><QrCode size={32} /></div>
            </div>
            <div className="t-min-photo">{emp.name.charAt(0)}</div>
            <div className="t-min-content">
                <h2 className="t-min-name">{emp.name}</h2>
                <div className="t-min-role">{emp.role}</div>
                <div className="t-min-stats">
                    <div className="t-min-row"><span>ID</span><span>{emp.id}</span></div>
                    <div className="t-min-row"><span>EXP</span><span>{emp.expiry}</span></div>
                    <div className="t-min-row"><span>PH</span><span>{emp.phone}</span></div>
                </div>
            </div>
            <div className="t-min-footer">
                <div className="t-min-code">AUTH-8829-X</div>
            </div>
        </div>
    );

    return (
        <div className="id-card-overlay">
            <div className="id-card-modal animate-slide-up">
                <div className="modal-header">
                    <div className="header-title">
                        <Printer size={20} />
                        <h3>ID Card Generator</h3>
                    </div>
                    <div className="header-actions">
                        <button className="btn-flip" onClick={() => setShowTemplateModal(true)}>
                            <span style={{ fontSize: '18px' }}>🎨</span> Template
                        </button>
                        <button className="btn-flip" onClick={() => setIsFlipped(!isFlipped)}>
                            <RotateCw size={18} /> Flip
                        </button>
                        <button className="btn-print" onClick={handlePrint}>
                            <Printer size={18} /> Print
                        </button>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="modal-body" style={{ flexDirection: 'column', alignItems: 'center' }}>

                    {/* Template Selector */}
                    <div className="template-selector">
                        {['modern', 'corporate', 'minimal'].map(t => (
                            <button
                                key={t}
                                className={`template-btn ${selectedTemplate === t ? 'active' : ''}`}
                                onClick={() => { setSelectedTemplate(t); setIsFlipped(false); }}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* 3D Card Area */}
                    <div className={`id-card-3d-wrapper ${isFlipped ? 'flipped' : ''}`}>
                        <div className="id-card-inner">
                            {/* Front Side Dynamic Rendering */}
                            {selectedTemplate === 'modern' && renderModern()}
                            {selectedTemplate === 'corporate' && renderCorporate()}
                            {selectedTemplate === 'minimal' && renderMinimal()}

                            {/* Back Side (Common for now, but could be specific) */}
                            <div className="id-card-face id-card-back-v2">
                                <div className="back-v2-bg"></div>
                                <div className="back-v2-content">
                                    <ul className="v2-policy-list">
                                        <li>This card is property of {emp.org}.</li>
                                        <li>If found, please return to the nearest office.</li>
                                        <li>Unauthorized use is strictly prohibited.</li>
                                    </ul>

                                    <div className="v2-back-dates">
                                        <div className="date-row">Issued: {emp.joined}</div>
                                        <div className="date-row">Valid Thru: {emp.expiry}</div>
                                    </div>

                                    <div className="v2-signature-area">
                                        <p>Authorized Signature</p>
                                        <h4 className="v2-sincerely">Management</h4>
                                    </div>

                                    <div className="v2-back-footer">
                                        <div className="v2-back-footer-white">
                                            <div className="v2-back-org">
                                                <h3>{emp.org}</h3>
                                                <p>www.company.com</p>
                                            </div>
                                        </div>
                                        <div className="v2-back-footer-accent"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-tip">
                    <Info size={16} />
                    <span>Select a template above. Click "Flip" to view back. Ready for CR80 printing.</span>
                </div>
            </div>
        </div>
    );
}
