'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, Search, Plus, Edit2, Trash2,
    Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    MapPin, Info, LayoutGrid, List, Upload, X, Check
} from 'lucide-react';
import { 
    getAllHolidays, deleteHoliday, getMyProfile,
    apiPreviewHolidays, apiImportHolidays
} from '@/api/api_clientadmin';
import HolidayModal from './HolidayModal';
import './HolidayCalendar.css';

// Indian States for state-based holidays (copied from HolidaySettings)
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// --- Import Modal Component (Reused from HolidaySettings) ---
function HolidayImportModal({ onClose, onImport, currentYear }) {
    const [step, setStep] = useState(1); 
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

    const handleNext = async () => {
        if (step === 1 && selectedCountry) {
            setStep(2);
        } else if (step === 2 && (includeNational || selectedStates.length > 0)) {
            setIsLoadingPreview(true);
            try {
                const response = await apiPreviewHolidays({
                    year,
                    country: selectedCountry,
                    include_national: includeNational,
                    states: selectedStates
                });
                setPreviewHolidays(response.data.holidays || []);
                setStep(3);
            } catch (error) {
                alert('Failed to load preview');
            } finally {
                setIsLoadingPreview(false);
            }
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            await onImport(year, selectedCountry, includeNational, selectedStates);
            onClose();
        } catch (error) {
            alert('Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="hol-modal-overlay" onClick={onClose}>
            <div className="hol-modal-content" onClick={e => e.stopPropagation()}>
                <div className="hol-modal-header">
                    <h3>Import National Holidays ({step}/3)</h3>
                    <button className="hol-close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="hol-modal-body">
                    {step === 1 && (
                        <div className="hol-import-step">
                            <label>Select Year</label>
                            <input type="number" className="hol-input" value={year} onChange={e => setYear(parseInt(e.target.value))} />
                            <label style={{ marginTop: '1rem' }}>Select Country</label>
                            <div className="hol-country-grid">
                                {countries.map(c => (
                                    <div key={c.code} className={`hol-country-card ${selectedCountry === c.code ? 'active' : ''}`} onClick={() => setSelectedCountry(c.code)}>
                                        <span>{c.flag}</span> {c.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="hol-import-step">
                            <div className="hol-toggle-row">
                                <span>National Holidays</span>
                                <input type="checkbox" checked={includeNational} onChange={e => setIncludeNational(e.target.checked)} />
                            </div>
                            <label style={{ marginTop: '1rem' }}>Regional States</label>
                            <div className="hol-state-grid">
                                {INDIAN_STATES.map(s => (
                                    <label key={s} className="hol-state-checkbox">
                                        <input type="checkbox" checked={selectedStates.includes(s)} onChange={() => toggleState(s)} />
                                        {s}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="hol-import-step">
                            <p>We found {previewHolidays.length} holidays for {year}.</p>
                            <div className="hol-preview-list">
                                {previewHolidays.map((h, i) => (
                                    <div key={i} className="hol-preview-item">
                                        <strong>{h.date}</strong>: {h.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="hol-modal-footer">
                    <button className="hol-btn-sec" onClick={onClose}>Cancel</button>
                    {step < 3 ? (
                        <button className="hol-btn-pri" onClick={handleNext} disabled={isLoadingPreview}>
                            {isLoadingPreview ? 'Loading...' : 'Next'}
                        </button>
                    ) : (
                        <button className="hol-btn-pri" onClick={handleImport} disabled={isImporting}>
                            {isImporting ? 'Importing...' : `Import ${previewHolidays.length} Holidays`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HolidayCalendar() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const currentYear = new Date().getFullYear();
    const [viewYear, setViewYear] = useState(currentYear);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [showImportModal, setShowImportModal] = useState(false);
    const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

    useEffect(() => {
        fetchInitialData();
    }, [viewYear]);

    const getUpcomingHolidays = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return (holidays || [])
            .filter(h => new Date(h.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);
    };

    const handleImportHolidays = async (year, country, includeNational, selectedStates) => {
        try {
            await apiImportHolidays({
                year,
                country,
                include_national: includeNational,
                states: selectedStates
            });
            await fetchInitialData();
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [holRes, profRes] = await Promise.all([
                getAllHolidays(),
                getMyProfile()
            ]);
            const data = holRes.data.results || (Array.isArray(holRes.data) ? holRes.data : []);
            setHolidays(data);
            setCurrentUser(profRes.data.employee || profRes.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load holiday calendar.');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = currentUser?.is_staff || currentUser?.is_admin || currentUser?.role === 'admin';

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await deleteHoliday(id);
            fetchInitialData();
        } catch (err) {
            alert('Failed to delete holiday');
        }
    };

    const handleEdit = (holiday) => {
        setSelectedHoliday(holiday);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedHoliday(null);
        setIsModalOpen(true);
    };

    const getMonthName = (dateStr) => {
        // Fix for ISO date string - ensures local orientation
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleString('default', { month: 'short' });
    };

    const getDay = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.getDate();
    };

    const filteredHolidays = (holidays || []).filter(h => {
        const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || h.holiday_type === filterType;
        const matchesYear = new Date(h.date).getFullYear() === viewYear;
        return matchesSearch && matchesType && matchesYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (loading) {
        return (
            <div className="leave-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading holiday calendar...</p>
            </div>
        );
    }

    const renderCalendarView = () => {
        const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
        const startDay = new Date(viewYear, activeMonth, 1).getDay();
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth(activeMonth, viewYear); i++) days.push(i);

        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="hol-calendar-wrap">
                <div className="hol-calendar-nav">
                    <button onClick={() => setActiveMonth(m => m === 0 ? 11 : m - 1)} className="year-nav-btn"><ChevronLeft size={18} /></button>
                    <span className="hol-month-label">
                        {new Date(viewYear, activeMonth).toLocaleString('default', { month: 'long' })} {viewYear}
                    </span>
                    <button onClick={() => setActiveMonth(m => m === 11 ? 0 : m + 1)} className="year-nav-btn"><ChevronRight size={18} /></button>
                </div>
                <div className="hol-calendar-grid">
                    {weekDays.map(d => <div key={d} className="hol-calendar-day-head">{d}</div>)}
                    {days.map((day, i) => {
                        if (!day) return <div key={`e-${i}`} className="hol-calendar-day empty" />;
                        
                        const dateStr = `${viewYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayHolidays = holidays.filter(h => h.date === dateStr);
                        const isToday = new Date().toDateString() === new Date(viewYear, activeMonth, day).toDateString();

                        return (
                            <div key={i} className={`hol-calendar-day ${dayHolidays.length ? 'has-holiday' : ''} ${isToday ? 'today' : ''}`}>
                                <span className="day-num">{day}</span>
                                <div className="day-holidays">
                                    {dayHolidays.map(h => (
                                        <div key={h.id} className={`hol-dot ${h.holiday_type}`} title={h.name} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const upcoming = getUpcomingHolidays();

    return (
        <div className="holiday-calendar">
            {/* Upcoming Holidays Hero Section */}
            {upcoming.length > 0 && !searchTerm && (
                <div className="hol-hero">
                    <div className="hol-hero__main">
                        <div className="hol-hero__badge">Next Holiday</div>
                        <h2 className="hol-hero__title">{upcoming[0].name}</h2>
                        <div className="hol-hero__date">
                            <Calendar size={20} />
                            {new Date(upcoming[0].date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <p className="hol-hero__desc">{upcoming[0].description || "Enjoy your upcoming time off!"}</p>
                    </div>
                    <div className="hol-hero__upcoming">
                        <h4>Subsequent Holidays</h4>
                        {upcoming.slice(1).map(h => (
                            <div key={h.id} className="hol-hero__mini">
                                <span className="mini-date">{new Date(h.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                <span className="mini-name">{h.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="holiday-toolbar">
                <div className="holiday-toolbar__left">
                    <div className="holiday-search">
                        <Search size={18} className="holiday-search__icon" />
                        <input
                            type="text"
                            placeholder="Search holiday..."
                            className="holiday-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="holiday-filter"
                        style={{
                            padding: '0.625rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-body)',
                            fontSize: '0.875rem'
                        }}
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="public">Public</option>
                        <option value="restricted">Restricted</option>
                        <option value="optional">Optional</option>
                    </select>

                    <div className="year-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-body)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <button onClick={() => setViewYear(v => v - 1)} className="year-nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={16} /></button>
                        <span style={{ fontWeight: 600 }}>{viewYear}</span>
                        <button onClick={() => setViewYear(v => v + 1)} className="year-nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronRight size={16} /></button>
                    </div>

                    <div className="view-toggle" style={{ display: 'flex', gap: '4px', background: 'var(--bg-muted)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <button 
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                            onClick={() => setViewMode('calendar')}
                            title="Calendar View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>

                <div className="holiday-toolbar__right">
                    {isAdmin && (
                        <>
                            <button className="holiday-btn holiday-btn--sec" onClick={() => setShowImportModal(true)} style={{ marginRight: '8px' }}>
                                <Upload size={18} />
                                Import
                            </button>
                            <button className="holiday-btn holiday-btn--primary" onClick={handleAdd}>
                                <Plus size={18} />
                                Add Holiday
                            </button>
                        </>
                    )}
                </div>
            </div>

            {viewMode === 'calendar' ? (
                renderCalendarView()
            ) : (
                filteredHolidays.length === 0 ? (
                    <div className="holiday-empty">
                        <Calendar size={48} />
                        <h3>Your Holiday Calendar is Empty</h3>
                        <p>No holidays found for {viewYear}. Start by adding one or importing from the national calendar.</p>
                        {isAdmin && (
                            <button className="holiday-btn holiday-btn--primary" style={{ marginTop: '1rem' }} onClick={() => setShowImportModal(true)}>
                                <Upload size={16} /> Import National Holidays
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="holiday-grid">
                        {filteredHolidays.map(holiday => (
                            <div key={holiday.id} className="holiday-card">
                                <div className={`holiday-card__status ${holiday.holiday_type}`}></div>
                                <div className="holiday-card__content">
                                    <div className="holiday-card__header">
                                        <div className="holiday-card__date">
                                            <span className="holiday-card__day">{getDay(holiday.date)}</span>
                                            <span className="holiday-card__month">{getMonthName(holiday.date)}</span>
                                        </div>
                                        <div className="holiday-card__title-area">
                                            <span className="holiday-card__name">{holiday.name}</span>
                                            <span className={`holiday-card__type ${holiday.holiday_type}`} style={{ opacity: 0.8 }}>
                                                {holiday.holiday_type} Holiday
                                            </span>
                                        </div>
                                    </div>
                                    {holiday.description && (
                                        <p className="holiday-card__desc">{holiday.description}</p>
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="holiday-card__footer">
                                        <span className="text-secondary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Info size={12} /> Management
                                        </span>
                                        <div className="holiday-card__actions">
                                            <button className="holiday-action-btn" onClick={() => handleEdit(holiday)}><Edit2 size={14} /></button>
                                            <button className="holiday-action-btn delete" onClick={() => handleDelete(holiday.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}

            {isModalOpen && (
                <HolidayModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    holiday={selectedHoliday}
                    companyId={currentUser?.company?.id}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchInitialData();
                    }}
                />
            )}

            {showImportModal && (
                <HolidayImportModal
                    currentYear={viewYear}
                    onClose={() => setShowImportModal(false)}
                    onImport={handleImportHolidays}
                />
            )}
        </div>
    );
}
