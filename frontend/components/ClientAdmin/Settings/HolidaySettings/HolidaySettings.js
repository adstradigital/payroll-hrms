'use client';

import { useState, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, X, Calendar, Loader2,
    FileText, Printer, Download, Save, Upload
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from '@/api/config';
import './HolidaySettings.css';

// Indian States for state-based holidays
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// --- Import Modal Component ---
function HolidayImportModal({ onClose, onImport, currentYear }) {
    const [step, setStep] = useState(1); // 1: Select Country, 2: Select States, 3: Preview
    const [year, setYear] = useState(currentYear);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedStates, setSelectedStates] = useState([]);
    const [includeNational, setIncludeNational] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewHolidays, setPreviewHolidays] = useState([]);

    const countries = [
        { code: 'IN', name: 'India', flag: '🇮🇳' }
    ];

    const toggleState = (state) => {
        setSelectedStates(prev =>
            prev.includes(state)
                ? prev.filter(s => s !== state)
                : [...prev, state]
        );
    };

    const selectAllStates = () => {
        setSelectedStates(INDIAN_STATES);
    };

    const clearAllStates = () => {
        setSelectedStates([]);
    };

    const handleNext = () => {
        if (step === 1 && selectedCountry) {
            setStep(2);
        } else if (step === 2 && (includeNational || selectedStates.length > 0)) {
            handleViewHolidays();
        }
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setPreviewHolidays([]);
        } else if (step === 2) {
            setStep(1);
        }
    };

    const handleViewHolidays = async () => {
        setIsLoadingPreview(true);
        try {
            // Call API to get preview of holidays
            const response = await axiosInstance.post(
                `${CLIENTADMIN_ENDPOINTS.HOLIDAYS}preview/`,
                {
                    year,
                    country: selectedCountry,
                    include_national: includeNational,
                    states: selectedStates
                }
            );
            setPreviewHolidays(response.data.holidays || []);
            setStep(3);
        } catch (error) {
            console.error('Failed to load preview:', error);
            // Fallback to showing sample data if API fails
            const holidays = [];
            if (includeNational) {
                holidays.push(
                    { name: 'Republic Day', date: `${year}-01-26`, type: 'public', description: 'National Holiday' },
                    { name: 'Independence Day', date: `${year}-08-15`, type: 'public', description: 'National Holiday' },
                    { name: 'Gandhi Jayanti', date: `${year}-10-02`, type: 'public', description: 'National Holiday' },
                );
            }
            setPreviewHolidays(holidays);
            setStep(3);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            await onImport(year, selectedCountry, includeNational, selectedStates);
            onClose();
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setIsImporting(false);
        }
    };

    const renderStep1 = () => (
        <>
            <div className="import-section">
                <h4>Select Year</h4>
                <div className="form-group">
                    <input
                        type="number"
                        className="form-input"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        min={currentYear}
                        max={currentYear + 10}
                    />
                </div>
            </div>

            <div className="import-section">
                <h4>Select Country</h4>
                <div className="country-grid">
                    {countries.map(country => (
                        <div
                            key={country.code}
                            className={`country-card ${selectedCountry === country.code ? 'selected' : ''}`}
                            onClick={() => setSelectedCountry(country.code)}
                        >
                            <span className="country-flag">{country.flag}</span>
                            <span className="country-name">{country.name}</span>
                        </div>
                    ))}
                </div>
                <p className="import-info-text">More countries coming soon...</p>
            </div>
        </>
    );

    const renderStep2 = () => (
        <>
            <div className="import-section">
                <div className="settings-toggle-item wide">
                    <div className="toggle-info">
                        <span className="toggle-label">Include National Holidays</span>
                        <span className="toggle-desc">Republic Day, Independence Day, Gandhi Jayanti, etc.</span>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={includeNational}
                            onChange={(e) => setIncludeNational(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div className="import-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4>State-Specific Holidays ({selectedStates.length} selected)</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn-link"
                            onClick={selectAllStates}
                            type="button"
                        >
                            Select All
                        </button>
                        <button
                            className="btn-link"
                            onClick={clearAllStates}
                            type="button"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="state-grid">
                    {INDIAN_STATES.map(state => (
                        <div key={state} className="state-checkbox">
                            <input
                                type="checkbox"
                                id={`state-${state}`}
                                checked={selectedStates.includes(state)}
                                onChange={() => toggleState(state)}
                            />
                            <label htmlFor={`state-${state}`}>{state}</label>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    const renderStep3 = () => (
        <div className="import-section">
            <div style={{ marginBottom: '16px' }}>
                <h4>Preview Holidays ({previewHolidays.length} holidays)</h4>
                <p className="import-info-text">
                    Review the holidays before importing. These will be added to your calendar.
                </p>
            </div>

            {isLoadingPreview ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--brand-primary)" />
                </div>
            ) : previewHolidays.length > 0 ? (
                <div className="holiday-preview-list">
                    {previewHolidays.map((holiday, index) => (
                        <div key={index} className="holiday-preview-item">
                            <div className="holiday-preview-date">
                                <div className="date-day">
                                    {new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric' })}
                                </div>
                                <div className="date-month">
                                    {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                                </div>
                            </div>
                            <div className="holiday-preview-info">
                                <div className="holiday-preview-name">{holiday.name}</div>
                                <div className="holiday-preview-meta">
                                    <span className={`holiday-tag ${holiday.type || 'public'}`}>
                                        {holiday.type || 'public'}
                                    </span>
                                    {holiday.description && (
                                        <span className="holiday-preview-desc">{holiday.description}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No holidays found for the selected options.
                </div>
            )}
        </div>
    );

    const getStepTitle = () => {
        switch (step) {
            case 1: return 'Import Holidays - Select Country';
            case 2: return 'Import Holidays - Select Regions';
            case 3: return 'Import Holidays - Review';
            default: return 'Import Holidays';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content import-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{getStepTitle()}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Step Indicator */}
                    <div className="step-indicator">
                        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="step-number">1</div>
                            <div className="step-label">Country</div>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                            <div className="step-number">2</div>
                            <div className="step-label">Regions</div>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <div className="step-label">Review</div>
                        </div>
                    </div>

                    {/* Step Content */}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                <div className="modal-actions">
                    {step > 1 && (
                        <button
                            className="btn-secondary"
                            onClick={handleBack}
                            disabled={isImporting || isLoadingPreview}
                        >
                            Back
                        </button>
                    )}

                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isImporting || isLoadingPreview}
                    >
                        Cancel
                    </button>

                    {step < 3 ? (
                        <button
                            className="btn-primary"
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !selectedCountry) ||
                                (step === 2 && !includeNational && selectedStates.length === 0) ||
                                isLoadingPreview
                            }
                        >
                            {isLoadingPreview ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    {step === 2 ? 'View Holidays' : 'Next'}
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={handleImport}
                            disabled={isImporting || previewHolidays.length === 0}
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Import {previewHolidays.length} Holidays
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Report Modal Component ---
function HolidayReportModal({ year, holidays, onClose }) {
    const yearHolidays = holidays
        .filter(h => new Date(h.date).getFullYear() === year)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Holiday Name,Type,Description\n"
            + yearHolidays.map(h => `${h.date},"${h.name}",${h.holiday_type},"${h.description || ''}"`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Holidays_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{year} Holiday Report</h3>
                    <div className="report-actions">
                        <button className="btn-secondary" onClick={handleDownload} title="Download CSV">
                            <Download size={16} />
                        </button>
                        <button className="btn-primary" onClick={handlePrint} title="Print Report">
                            <Printer size={16} /> Print
                        </button>
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Company Holiday Calendar</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Year: {year}</p>
                    </div>

                    {yearHolidays.length > 0 ? (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Holiday Name</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yearHolidays.map(h => (
                                    <tr key={h.id}>
                                        <td>{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</td>
                                        <td style={{ fontWeight: 500 }}>{h.name}</td>
                                        <td>
                                            <span className={`holiday-tag ${h.holiday_type || 'public'}`} style={{ display: 'inline-block', width: 'auto' }}>
                                                {h.holiday_type}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{h.description || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No holidays found for {year}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---
export default function HolidaySettings() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReport, setShowReport] = useState(false);
    const [showImport, setShowImport] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedHoliday, setSelectedHoliday] = useState(null);

    // Form State
    const [holidayName, setHolidayName] = useState('');
    const [holidayType, setHolidayType] = useState('public');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.HOLIDAYS);
            const data = response.data.results || response.data;
            setHolidays(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch holidays:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImportHolidays = async (year, country, includeNational, selectedStates) => {
        try {
            // Call your backend API to import holidays
            await axiosInstance.post(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}import/`, {
                year,
                country,
                include_national: includeNational,
                states: selectedStates
            });

            await fetchHolidays();
        } catch (error) {
            console.error('Failed to import holidays:', error);
            throw error;
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDate = (date1, date2) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const getHolidayForDate = (date) => {
        if (!date) return null;
        return holidays.find(h => {
            const hDate = new Date(h.date);
            return isSameDate(date, hDate);
        });
    };

    const handleDateClick = (date) => {
        if (!date) return;

        const existingHoliday = getHolidayForDate(date);
        setSelectedDate(date);

        if (existingHoliday) {
            setModalMode('delete');
            setSelectedHoliday(existingHoliday);
            setHolidayName(existingHoliday.name);
            setHolidayType(existingHoliday.holiday_type || 'public');
            setDescription(existingHoliday.description || '');
        } else {
            setModalMode('add');
            setSelectedHoliday(null);
            setHolidayName('');
            setHolidayType('public');
            setDescription('');
        }
        setShowModal(true);
    };

    const handleSaveHoliday = async () => {
        if (!holidayName.trim()) return;

        try {
            setIsSubmitting(true);
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            await axiosInstance.post(CLIENTADMIN_ENDPOINTS.HOLIDAYS, {
                name: holidayName,
                date: formattedDate,
                holiday_type: holidayType,
                description: description
            });

            await fetchHolidays();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to create holiday:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteHoliday = async () => {
        if (!selectedHoliday) return;

        try {
            setIsSubmitting(true);
            await axiosInstance.delete(`${CLIENTADMIN_ENDPOINTS.HOLIDAYS}${selectedHoliday.id}/`);
            await fetchHolidays();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to delete holiday:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderModal = () => {
        if (!showModal) return null;

        const isAdd = modalMode === 'add';
        const modalTitle = isAdd ? 'Set Holiday' : 'Manage Holiday';
        const dateString = selectedDate?.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>{modalTitle}</h3>
                        <button className="close-btn" onClick={() => setShowModal(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="modal-body">
                        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            {dateString}
                        </p>

                        {isAdd ? (
                            <>
                                <div className="form-group">
                                    <label>Holiday Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Founder's Day"
                                        value={holidayName}
                                        onChange={(e) => setHolidayName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        className="form-select"
                                        value={holidayType}
                                        onChange={(e) => setHolidayType(e.target.value)}
                                    >
                                        <option value="public">Public Holiday</option>
                                        <option value="restricted">Restricted Holiday</option>
                                        <option value="optional">Optional Holiday</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Additional details..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Holiday Name</span>
                                    <h4 style={{ marginTop: '4px', fontSize: '16px', color: 'var(--text-primary)' }}>{selectedHoliday.name}</h4>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Type</span>
                                    <div style={{ marginTop: '4px' }}>
                                        <span className={`holiday-tag ${selectedHoliday.holiday_type || 'public'}`} style={{ display: 'inline-block', width: 'auto' }}>
                                            {selectedHoliday.holiday_type}
                                        </span>
                                    </div>
                                </div>
                                {selectedHoliday.description && (
                                    <div>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Description</span>
                                        <p style={{ marginTop: '4px', color: 'var(--text-primary)', fontSize: '14px' }}>{selectedHoliday.description}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        {!isAdd && (
                            <button
                                className="btn-danger"
                                onClick={handleDeleteHoliday}
                                disabled={isSubmitting}
                                style={{ marginRight: 'auto' }}
                            >
                                Remove Holiday
                            </button>
                        )}

                        <button
                            className="btn-secondary"
                            onClick={() => setShowModal(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>

                        {isAdd && (
                            <button
                                className="btn-primary"
                                onClick={handleSaveHoliday}
                                disabled={isSubmitting || !holidayName.trim()}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                Set Holiday
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="holiday-settings-container">
            <div className="holiday-settings__header">
                <div className="holiday-settings__title">
                    <h2>Holiday Calendar</h2>
                    <p>Manage company holidays and non-working days</p>
                </div>

                <div className="calendar-controls">
                    <button
                        className="btn-secondary"
                        onClick={() => setShowImport(true)}
                        title="Import Holidays"
                    >
                        <Upload size={16} /> Import
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => setShowReport(true)}
                        title="View Yearly Report"
                    >
                        <FileText size={16} /> Report
                    </button>

                    <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className="current-month">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button className="calendar-nav-btn" onClick={handleNextMonth}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', flex: 1, alignItems: 'center' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--brand-primary)" />
                </div>
            ) : (
                <div className="calendar-grid">
                    {weekDays.map(day => (
                        <div key={day} className="calendar-day-header">
                            {day}
                        </div>
                    ))}

                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                        }

                        const holiday = getHolidayForDate(date);
                        const isToday = isSameDate(date, new Date());

                        return (
                            <div
                                key={date.toISOString()}
                                className={`calendar-day ${holiday ? 'is-holiday' : ''} ${isToday ? 'is-today' : ''}`}
                                onClick={() => handleDateClick(date)}
                            >
                                <span className="day-number">{date.getDate()}</span>
                                <div className="day-content">
                                    {holiday && (
                                        <div className={`holiday-tag ${holiday.holiday_type || 'public'}`} title={holiday.name}>
                                            {holiday.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {renderModal()}

            {showReport && (
                <HolidayReportModal
                    year={currentDate.getFullYear()}
                    holidays={holidays}
                    onClose={() => setShowReport(false)}
                />
            )}

            {showImport && (
                <HolidayImportModal
                    currentYear={currentDate.getFullYear()}
                    onClose={() => setShowImport(false)}
                    onImport={handleImportHolidays}
                />
            )}
        </div>
    );
}
