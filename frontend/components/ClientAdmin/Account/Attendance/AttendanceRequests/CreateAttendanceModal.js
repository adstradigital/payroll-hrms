'use client';

import { X } from 'lucide-react';
import './CreateAttendanceModal.css';

export default function CreateAttendanceModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => {
            if (e.target.classList && e.target.classList.contains('modal-overlay')) onClose();
        }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">New Attendances Request</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <form className="form-grid">
                        {/* Employee */}
                        <div className="form-group">
                            <label className="form-label">Employee <span className="required-star">*</span></label>
                            <select className="form-control">
                                <option>Adam Luis (PEP00)</option>
                                <option>Ankit Pokhrel (PEP0003)</option>
                            </select>
                        </div>

                        {/* Create Bulk Toggle */}
                        <div className="form-group">
                            <label className="form-label">Create Bulk</label>
                            <div className="toggle-wrapper">
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>

                        {/* Attendance Date */}
                        <div className="form-group">
                            <label className="form-label">Attendance date <span className="required-star">*</span></label>
                            <div className="relative">
                                <input type="date" className="form-control w-full" />
                            </div>
                        </div>

                        {/* Shift */}
                        <div className="form-group">
                            <label className="form-label">Shift <span className="required-star">*</span></label>
                            <select className="form-control">
                                <option>---Choose Shift---</option>
                                <option>Regular Shift</option>
                                <option>Night Shift</option>
                            </select>
                        </div>

                        {/* Work Type */}
                        <div className="form-group">
                            <label className="form-label">Work Type</label>
                            <select className="form-control">
                                <option>---Choose Work Type---</option>
                                <option>Work From Office</option>
                                <option>Work From Home</option>
                            </select>
                        </div>

                        {/* Check-In Date */}
                        <div className="form-group">
                            <label className="form-label">Check-In Date <span className="required-star">*</span></label>
                            <input type="date" className="form-control" />
                        </div>

                        {/* Check-In Time */}
                        <div className="form-group">
                            <label className="form-label">Check-In <span className="required-star">*</span> <span className="info-icon">ⓘ</span></label>
                            <div className="relative">
                                <input type="time" className="form-control w-full" />
                            </div>
                        </div>

                        {/* Check-Out Date */}
                        <div className="form-group">
                            <label className="form-label">Check-Out Date</label>
                            <input type="date" className="form-control" />
                        </div>

                        {/* Check-Out Time */}
                        <div className="form-group">
                            <label className="form-label">Check-Out <span className="info-icon">ⓘ</span></label>
                            <div className="relative">
                                <input type="time" className="form-control w-full" />
                            </div>
                        </div>

                        {/* Worked Hours */}
                        <div className="form-group">
                            <label className="form-label">Worked Hours <span className="required-star">*</span></label>
                            <input type="text" className="form-control" defaultValue="00:00" />
                        </div>

                        {/* Minimum Hour */}
                        <div className="form-group">
                            <label className="form-label">Minimum hour <span className="required-star">*</span></label>
                            <input type="text" className="form-control" defaultValue="00:00" />
                        </div>

                        {/* Spacer for grid alignment */}
                        <div className="form-group"></div>

                        {/* Description */}
                        <div className="form-group full-width">
                            <label className="form-label">Request Description <span className="required-star">*</span></label>
                            <textarea
                                className="form-control form-textarea"
                                placeholder="Request Description"
                            ></textarea>
                        </div>

                        {/* Batch Attendance */}
                        <div className="form-group">
                            <label className="form-label">Batch Attendance</label>
                            <select className="form-control">
                                <option>---Choose Batch Attendance---</option>
                            </select>
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary">Request</button>
                </div>
            </div>
        </div>
    );
}
