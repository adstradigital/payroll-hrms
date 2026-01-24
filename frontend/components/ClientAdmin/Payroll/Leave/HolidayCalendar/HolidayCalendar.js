'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, Search, Plus, Edit2, Trash2,
    Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    MapPin, Info
} from 'lucide-react';
import { getAllHolidays, deleteHoliday, getMyProfile } from '@/api/api_clientadmin';
import HolidayModal from './HolidayModal';
import './HolidayCalendar.css';

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

    useEffect(() => {
        fetchInitialData();
    }, [viewYear]);

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

    return (
        <div className="holiday-calendar">
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
                </div>

                {isAdmin && (
                    <div className="holiday-toolbar__right">
                        <button className="btn btn-primary" onClick={handleAdd}>
                            <Plus size={18} />
                            Add Holiday
                        </button>
                    </div>
                )}
            </div>

            {filteredHolidays.length === 0 ? (
                <div className="holiday-empty">
                    <Calendar size={48} />
                    <p>No holidays found for {viewYear}.</p>
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
        </div>
    );
}
