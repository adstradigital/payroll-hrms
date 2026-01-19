'use client';

import { useState, useRef } from 'react';
import { X, Printer, Download, Mail, Phone, MapPin, ShieldCheck, QrCode, RotateCw, Info } from 'lucide-react';
import './IdCard.css';

export default function IdCard({ employee, onClose }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const printRef = useRef();

    const handlePrint = () => {
        window.print();
    };

    const emp = {
        name: employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee Name',
        role: employee.designation_name || employee.designation?.name || 'Graphic Designer',
        id: employee.employee_id || 'ID-0000000',
        email: employee.email || 'yourmail@goeshere.com',
        phone: employee.phone || '000-000-00',
        blood: employee.blood_group || 'AB',
        joined: employee.date_of_joining || 'MM/DD/YEAR',
        expiry: '12/31/2026',
        org: 'COMPANY NAME',
        tagline: 'TAGLINE GOES HERE'
    };

    return (
        <div className="id-card-overlay">
            <div className="id-card-modal animate-slide-up">
                <div className="modal-header">
                    <div className="header-title">
                        <Printer size={20} />
                        <h3>ID Card Preview</h3>
                    </div>
                    <div className="header-actions">
                        <button className="btn-flip" onClick={() => setIsFlipped(!isFlipped)}>
                            <RotateCw size={18} /> Flip Card
                        </button>
                        <button className="btn-print" onClick={handlePrint}>
                            <Printer size={18} /> Print & PDF
                        </button>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="modal-body">
                    <div className={`id-card-3d-wrapper ${isFlipped ? 'flipped' : ''}`}>
                        <div className="id-card-inner">
                            {/* Front Side */}
                            <div className="id-card-face id-card-front-v2">
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
                                    <div className="v2-info-row">
                                        <span className="v2-label">ID No</span>
                                        <span className="v2-sep">:</span>
                                        <span className="v2-val">{emp.id}</span>
                                    </div>
                                    <div className="v2-info-row">
                                        <span className="v2-label">Blood</span>
                                        <span className="v2-sep">:</span>
                                        <span className="v2-val">{emp.blood}</span>
                                    </div>
                                    <div className="v2-info-row">
                                        <span className="v2-label">Email</span>
                                        <span className="v2-sep">:</span>
                                        <span className="v2-val">{emp.email}</span>
                                    </div>
                                    <div className="v2-info-row">
                                        <span className="v2-label">Phone</span>
                                        <span className="v2-sep">:</span>
                                        <span className="v2-val">{emp.phone}</span>
                                    </div>
                                </div>

                                <div className="v2-footer">
                                    <div className="v2-barcode">
                                        <div className="barcode-bars"></div>
                                        <span>{emp.id}</span>
                                    </div>
                                    <div className="v2-footer-accent"></div>
                                </div>
                            </div>

                            {/* Back Side */}
                            <div className="id-card-face id-card-back-v2">
                                <div className="back-v2-bg"></div>
                                <div className="back-v2-content">
                                    <ul className="v2-policy-list">
                                        <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod.</li>
                                        <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod.</li>
                                    </ul>

                                    <div className="v2-back-dates">
                                        <div className="date-row">Joined Date : {emp.joined}</div>
                                        <div className="date-row">Expire Date : {emp.expiry}</div>
                                        <div className="date-row">Emp ID : {emp.id}</div>
                                    </div>

                                    <div className="v2-signature-area">
                                        <p>Your Signature</p>
                                        <h4 className="v2-sincerely">Your Sincerely</h4>
                                    </div>

                                    <div className="v2-back-footer">
                                        <div className="v2-back-footer-white">
                                            <div className="v2-back-org">
                                                <h3>{emp.org}</h3>
                                                <p>{emp.tagline}</p>
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
                    <span>Click "Flip Card" to see the back. Standard CR80 print size.</span>
                </div>
            </div>
        </div>
    );
}
