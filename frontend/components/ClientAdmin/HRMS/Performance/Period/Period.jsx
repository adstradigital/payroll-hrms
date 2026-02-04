'use client';

import { useState, useEffect } from 'react';
import { 
    Search, Plus, Calendar, Edit2, Trash2, 
    Play, StopCircle, MoreVertical, CheckCircle, Clock, XCircle 
} from 'lucide-react';
import { 
    getReviewPeriods, createReviewPeriod, updateReviewPeriod, 
    deleteReviewPeriod, activateReviewPeriod, closeReviewPeriod 
} from '../services/performanceService';
import './Period.css';

export default function Period() {
    const [periods, setPeriods] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        review_type: 'quarterly',
        start_date: '',
        end_date: '',
        submission_deadline: '',
        description: ''
    });

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        setLoading(true);
        try {
            const data = await getReviewPeriods();
            setPeriods(data || []);
        } catch (error) {
            console.error('Failed to load periods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPeriod) {
                await updateReviewPeriod(editingPeriod.id, formData);
            } else {
                await createReviewPeriod(formData);
            }
            setShowModal(false);
            resetForm();
            loadPeriods();
        } catch (error) {
            console.error('Failed to save period:', error);
        }
    };

    const handleEdit = (period) => {
        setEditingPeriod(period);
        setFormData({
            name: period.name,
            review_type: period.review_type,
            start_date: period.start_date,
            end_date: period.end_date,
            submission_deadline: period.submission_deadline,
            description: period.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this period?')) {
            try {
                await deleteReviewPeriod(id);
                loadPeriods();
            } catch (error) {
                console.error('Failed to delete period:', error);
            }
        }
    };

    const handleActivate = async (id) => {
        try {
            await activateReviewPeriod(id);
            loadPeriods();
        } catch (error) {
            console.error('Failed to activate period:', error);
        }
    };

    const handleClose = async (id) => {
        if (confirm('Are you sure you want to close this period?')) {
            try {
                await closeReviewPeriod(id);
                loadPeriods();
            } catch (error) {
                console.error('Failed to close period:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingPeriod(null);
        setFormData({
            name: '',
            review_type: 'quarterly',
            start_date: '',
            end_date: '',
            submission_deadline: '',
            description: ''
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { class: 'badge-secondary', icon: Clock, label: 'Draft' },
            active: { class: 'badge-success', icon: Play, label: 'Active' },
            completed: { class: 'badge-info', icon: CheckCircle, label: 'Completed' },
            cancelled: { class: 'badge-danger', icon: XCircle, label: 'Cancelled' }
        };
        return badges[status] || badges.draft;
    };

    const getTypeLabel = (type) => {
        const types = {
            annual: 'Annual Review',
            quarterly: 'Quarterly Review',
            half_yearly: 'Half Yearly Review',
            probation: 'Probation Review'
        };
        return types[type] || type;
    };

    const filteredPeriods = periods.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="period">
            <div className="period-toolbar">
                <div className="period-search">
                    <Search size={18} className="period-search__icon" />
                    <input
                        type="text"
                        placeholder="Search periods..."
                        className="period-search__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} />
                    Add Period
                </button>
            </div>

            {loading ? (
                <div className="period-loading">Loading...</div>
            ) : (
                <div className="period-table-container">
                    <table className="period-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Deadline</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPeriods.map(period => {
                                const badge = getStatusBadge(period.status);
                                return (
                                    <tr key={period.id}>
                                        <td className="period-name">{period.name}</td>
                                        <td>{getTypeLabel(period.review_type)}</td>
                                        <td>{period.start_date}</td>
                                        <td>{period.end_date}</td>
                                        <td>{period.submission_deadline}</td>
                                        <td>
                                            <span className={`badge ${badge.class}`}>
                                                <badge.icon size={12} />
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="period-actions">
                                                {period.status === 'draft' && (
                                                    <button 
                                                        className="btn-icon btn-icon--success"
                                                        onClick={() => handleActivate(period.id)}
                                                        title="Activate"
                                                    >
                                                        <Play size={16} />
                                                    </button>
                                                )}
                                                {period.status === 'active' && (
                                                    <button 
                                                        className="btn-icon btn-icon--warning"
                                                        onClick={() => handleClose(period.id)}
                                                        title="Close"
                                                    >
                                                        <StopCircle size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(period)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    className="btn-icon btn-icon--danger"
                                                    onClick={() => handleDelete(period.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingPeriod ? 'Edit Period' : 'Add Period'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Period Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Review Type</label>
                                    <select
                                        value={formData.review_type}
                                        onChange={(e) => setFormData({...formData, review_type: e.target.value})}
                                    >
                                        <option value="annual">Annual Review</option>
                                        <option value="quarterly">Quarterly Review</option>
                                        <option value="half_yearly">Half Yearly Review</option>
                                        <option value="probation">Probation Review</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Submission Deadline</label>
                                    <input
                                        type="date"
                                        value={formData.submission_deadline}
                                        onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingPeriod ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
