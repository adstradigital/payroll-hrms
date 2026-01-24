import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle, XCircle, Calendar, Clock, FileText, TrendingUp, Copy } from 'lucide-react';
import { getLeaveTypes, deleteLeaveType, getMyProfile } from '@/api/api_clientadmin';
import LeaveTypeModal from './LeaveTypeModal';
import './LeaveTypes.css';

export default function LeaveTypes() {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPaid, setFilterPaid] = useState('all');
    const [filterCarryForward, setFilterCarryForward] = useState('all');
    const [filterActive, setFilterActive] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedLeaveType, setSelectedLeaveType] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

    useEffect(() => {
        fetchContextAndData();
    }, []);

    const fetchContextAndData = async () => {
        try {
            setLoading(true);

            // Fetch profile to get company context
            const profileRes = await getMyProfile();
            const profile = profileRes.data.employee;
            const cid = profile?.company?.id || profile?.company;
            setCompanyId(cid);

            const res = await getLeaveTypes();
            const typesData = res.data.results || (Array.isArray(res.data) ? res.data : []);
            setLeaveTypes(typesData);
            setError(null);
        } catch (err) {
            console.error('Error fetching leave types:', err);
            setError('Failed to load leave types. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedLeaveType(null);
        setShowModal(true);
    };

    const handleEdit = (leaveType) => {
        setSelectedLeaveType(leaveType);
        setShowModal(true);
    };

    const handleDuplicate = (leaveType) => {
        const duplicated = {
            ...leaveType,
            name: `${leaveType.name} (Copy)`,
            id: undefined
        };
        setSelectedLeaveType(duplicated);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this leave type? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingId(id);
            await deleteLeaveType(id);
            await fetchContextAndData();
        } catch (err) {
            console.error('Error deleting leave type:', err);
            alert('Failed to delete leave type. It may be in use by existing leave requests.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleModalSuccess = () => {
        fetchContextAndData();
        setShowModal(false);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterPaid('all');
        setFilterCarryForward('all');
        setFilterActive('all');
    };

    const filteredLeaveTypes = leaveTypes.filter(type => {
        const matchesSearch =
            type.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPaid = filterPaid === 'all' ||
            (filterPaid === 'paid' && type.is_paid) ||
            (filterPaid === 'unpaid' && !type.is_paid);

        const matchesCarryForward = filterCarryForward === 'all' ||
            (filterCarryForward === 'yes' && type.is_carry_forward) ||
            (filterCarryForward === 'no' && !type.is_carry_forward);

        const matchesActive = filterActive === 'all' ||
            (filterActive === 'active' && type.is_active) ||
            (filterActive === 'inactive' && !type.is_active);

        return matchesSearch && matchesPaid && matchesCarryForward && matchesActive;
    });

    // Calculate statistics
    const stats = {
        total: leaveTypes.length,
        active: leaveTypes.filter(t => t.is_active).length,
        paid: leaveTypes.filter(t => t.is_paid).length,
        totalDays: leaveTypes.filter(t => t.is_active).reduce((sum, t) => sum + parseFloat(t.days_per_year || 0), 0)
    };

    if (loading) {
        return (
            <div className="leave-types-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Loading leave types...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leave-types-error">
                <XCircle size={40} />
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchContextAndData}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="leave-types">
            {/* Toolbar */}
            <div className="leave-types-toolbar">
                <div className="leave-types-toolbar__left">
                    <div className="leave-types-search">
                        <Search size={18} className="leave-types-search__icon" />
                        <input
                            type="text"
                            placeholder="Search leave types..."
                            className="leave-types-search__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {(searchTerm || filterPaid !== 'all' || filterCarryForward !== 'all' || filterActive !== 'all') && (
                        <button className="btn-clear-filters" onClick={clearFilters}>
                            Clear Search
                        </button>
                    )}
                </div>

                <div className="leave-types-toolbar__right">
                    <button className="btn btn-primary" onClick={handleCreate}>
                        <Plus size={18} />
                        Add Leave Type
                    </button>
                </div>
            </div>

            {/* Content */}
            {filteredLeaveTypes.length === 0 ? (
                <div className="leave-types-empty">
                    <AlertCircle size={48} />
                    <h3>No Leave Types Found</h3>
                    <p>
                        {leaveTypes.length === 0
                            ? 'Get started by creating your first leave type.'
                            : 'No leave types match your search.'}
                    </p>
                    {leaveTypes.length === 0 && (
                        <button className="btn btn-primary" onClick={handleCreate}>
                            <Plus size={18} />
                            Add Leave Type
                        </button>
                    )}
                </div>
            ) : (
                <div className="leave-types-cards">
                    {filteredLeaveTypes.map(type => (
                        <div key={type.id} className={`leave-type-card ${!type.is_active ? 'inactive' : ''}`}>
                            <div className="leave-type-card__header">
                                <div className="leave-type-card__title">
                                    <h3>{type.name}</h3>
                                </div>
                                <div className="leave-type-card__status">
                                    {!type.is_active && (
                                        <span className="badge badge-danger">Inactive</span>
                                    )}
                                </div>
                            </div>

                            {type.description && (
                                <p className="leave-type-card__description">{type.description}</p>
                            )}

                            <div className="leave-type-card__days">
                                <div className="day-count">
                                    <span className="value">{type.days_per_year}</span>
                                    <span className="label">Days/Year</span>
                                </div>
                                <div className="divider"></div>
                                <div className="day-info">
                                    <span>Max {type.max_consecutive_days} consecutive</span>
                                    {type.is_paid ? (
                                        <span className="paid-status">Paid Leave</span>
                                    ) : (
                                        <span className="unpaid-status">Unpaid Leave</span>
                                    )}
                                </div>
                            </div>

                            <div className="leave-type-card__actions">
                                <button
                                    className="card-action-btn card-action-btn--edit"
                                    onClick={() => handleEdit(type)}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    className="card-action-btn card-action-btn--duplicate"
                                    onClick={() => handleDuplicate(type)}
                                    title="Duplicate"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    className="card-action-btn card-action-btn--danger"
                                    onClick={() => handleDelete(type.id)}
                                    disabled={deletingId === type.id}
                                    title="Delete"
                                >
                                    {deletingId === type.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <LeaveTypeModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    leaveType={selectedLeaveType}
                    companyId={companyId}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
}
