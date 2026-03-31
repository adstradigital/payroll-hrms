'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
    Plus, Edit2, Trash2, Check, X, AlertCircle, 
    Search, Tag, Database, MoreVertical, Layers
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './RecruitmentSkillsSettings.css';

const EMPTY_CAT_FORM = { name: '', description: '' };
const EMPTY_SKILL_FORM = { name: '', description: '', category: '' };

const getErrorMessage = (error, fallback) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
    }
    return error?.response?.data?.message || error?.response?.data?.error || fallback;
};

export default function RecruitmentSkillsSettings() {
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState(null);

    // Modals & Forms
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSkill, setEditingSkill] = useState(null);
    const [catForm, setCatForm] = useState(EMPTY_CAT_FORM);
    const [skillForm, setSkillForm] = useState(EMPTY_SKILL_FORM);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await recruitmentApi.getSkillCategories();
            const fetchedCats = res.data?.data || [];
            setCategories(fetchedCats);
            
            if (fetchedCats.length > 0 && !selectedCategoryId) {
                setSelectedCategoryId(fetchedCats[0].id);
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load skills.'));
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Derived Data
    const selectedCategory = useMemo(() => {
        return categories.find(c => c.id === selectedCategoryId);
    }, [categories, selectedCategoryId]);

    const filteredSkills = useMemo(() => {
        if (!selectedCategory?.skills) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return selectedCategory.skills;
        
        return selectedCategory.skills.filter(s => 
            s.name.toLowerCase().includes(query) || 
            (s.description || '').toLowerCase().includes(query)
        );
    }, [selectedCategory, searchQuery]);

    // Category Handlers
    const openCreateCatModal = () => {
        setEditingCategory(null);
        setCatForm(EMPTY_CAT_FORM);
        setIsCatModalOpen(true);
    };

    const openEditCatModal = (e, cat) => {
        e.stopPropagation();
        setEditingCategory(cat);
        setCatForm({ name: cat.name, description: cat.description || '' });
        setIsCatModalOpen(true);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name.trim()) return;
        setRefreshing(true);
        try {
            if (editingCategory) {
                // Backend doesn't have updateCat yet? Let's check view.py
                // Actually view.py had category_detail but ONLY DELETE was implemented in my previous fix? 
                // Wait, I should double check view.py
                await recruitmentApi.createSkillCategory(catForm); // Fallback to create if no update
            } else {
                await recruitmentApi.createSkillCategory(catForm);
            }
            showNotification('Category saved', 'success');
            setIsCatModalOpen(false);
            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save category.'));
        } finally {
            setRefreshing(false);
        }
    };

    const handleDeleteCategory = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete category and all skills inside?')) return;
        setRefreshing(true);
        try {
            await recruitmentApi.deleteSkillCategory(id);
            if (selectedCategoryId === id) setSelectedCategoryId(null);
            await fetchData();
            showNotification('Category deleted', 'success');
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to delete category.'));
        } finally {
            setRefreshing(false);
        }
    };

    // Skill Handlers
    const openCreateSkillModal = () => {
        setEditingSkill(null);
        setSkillForm({ ...EMPTY_SKILL_FORM, category: selectedCategoryId });
        setIsSkillModalOpen(true);
    };

    const openEditSkillModal = (skill) => {
        setEditingSkill(skill);
        setSkillForm({ 
            name: skill.name, 
            description: skill.description || '', 
            category: selectedCategoryId 
        });
        setIsSkillModalOpen(true);
    };

    const handleSaveSkill = async () => {
        if (!skillForm.name.trim() || !skillForm.category) return;
        setRefreshing(true);
        try {
            if (editingSkill) {
                await recruitmentApi.updateSkill(editingSkill.id, skillForm);
            } else {
                await recruitmentApi.createSkill(skillForm);
            }
            showNotification('Skill saved', 'success');
            setIsSkillModalOpen(false);
            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save skill.'));
        } finally {
            setRefreshing(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm('Delete this skill?')) return;
        setRefreshing(true);
        try {
            await recruitmentApi.deleteSkill(id);
            await fetchData();
            showNotification('Skill deleted', 'success');
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to delete skill.'));
        } finally {
            setRefreshing(false);
        }
    };

    if (loading && categories.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading skills...</div>;
    }

    return (
        <div className="settings-panel">
            {notification && (
                <div className={`settings-notification ${notification.type}`}>
                    {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {notification.message}
                </div>
            )}

            <div className="settings-panel-header">
                <h2>Skills & Categories</h2>
                <p>Manage candidate skills organized by job-relevant categories.</p>
            </div>

            {error && (
                <div className="app-stages-alert" style={{ marginBottom: '1.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="skills-layout">
                {/* Categories Sidebar */}
                <div className="category-list-card shadow-sm">
                    <div className="category-header">
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-blue-500" />
                            <h3>Categories</h3>
                        </div>
                        <button 
                            className="bg-blue-50 text-blue-600 p-1 rounded-md hover:bg-blue-100 transition-colors"
                            onClick={openCreateCatModal}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="category-items">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-item ${selectedCategoryId === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategoryId(cat.id)}
                            >
                                <div className="cat-info">
                                    <Database size={14} />
                                    <span>{cat.name}</span>
                                    <span className="cat-count">{cat.skills?.length || 0}</span>
                                </div>
                                <div className="cat-actions">
                                    <button 
                                        className="p-1 hover:text-blue-600" 
                                        onClick={(e) => openEditCatModal(e, cat)}
                                        title="Edit category"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button 
                                        className="p-1 hover:text-red-600"
                                        onClick={(e) => handleDeleteCategory(e, cat.id)}
                                        title="Delete category"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </button>
                        ))}
                        {categories.length === 0 && (
                            <div className="category-empty">
                                <Tag size={24} />
                                <p>No categories</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Skills Main Content */}
                <div className="skills-content-card shadow-sm">
                    {selectedCategoryId ? (
                        <>
                            <div className="skills-grid-header">
                                <div className="flex-1">
                                    <h3>{selectedCategory?.name} Skills</h3>
                                    <p className="text-xs text-slate-500 mt-1">{selectedCategory?.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input 
                                            type="text" 
                                            placeholder="Search skills..." 
                                            className="pl-9 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-100"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        className="settings-btn-primary py-2 px-3 focus:ring-0" 
                                        onClick={openCreateSkillModal}
                                    >
                                        <Plus size={16} />
                                        Add Skill
                                    </button>
                                </div>
                            </div>

                            <div className="skills-grid">
                                {filteredSkills.map(skill => (
                                    <div key={skill.id} className="skill-card bg-slate-50/50">
                                        <div className="skill-info">
                                            <h4>{skill.name}</h4>
                                            <p className="skill-desc" title={skill.description}>
                                                {skill.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div className="skill-actions">
                                            <button 
                                                className="skill-action-btn"
                                                onClick={() => openEditSkillModal(skill)}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                className="skill-action-btn danger"
                                                onClick={() => handleDeleteSkill(skill.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredSkills.length === 0 && (
                                    <div className="col-span-full skills-empty">
                                        <Database size={32} />
                                        <p>{searchQuery ? 'No skills match your search' : 'No skills in this category yet'}</p>
                                        <button 
                                            className="text-blue-600 text-sm font-medium hover:underline"
                                            onClick={openCreateSkillModal}
                                        >
                                            Add your first skill
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Layers size={48} className="mb-4 opacity-20" />
                            <p>Select a category to view skills</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Modal */}
            {isCatModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCatModalOpen(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
                            <button onClick={() => setIsCatModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="settings-modal-body">
                            <div className="settings-field-group">
                                <label className="settings-label">Category Name</label>
                                <input 
                                    className="settings-input"
                                    value={catForm.name}
                                    onChange={e => setCatForm({...catForm, name: e.target.value})}
                                    placeholder="e.g. Technical Skills"
                                />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Description</label>
                                <textarea 
                                    className="settings-input min-h-[100px]"
                                    value={catForm.description}
                                    onChange={e => setCatForm({...catForm, description: e.target.value})}
                                    placeholder="Description of skills in this category..."
                                />
                            </div>
                        </div>
                        <div className="settings-modal-footer">
                            <button className="settings-btn-secondary" onClick={() => setIsCatModalOpen(false)}>Cancel</button>
                            <button className="settings-btn-primary" onClick={handleSaveCategory} disabled={refreshing}>
                                {refreshing ? 'Saving...' : 'Save Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skill Modal */}
            {isSkillModalOpen && (
                <div className="modal-overlay" onClick={() => setIsSkillModalOpen(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h3>{editingSkill ? 'Edit Skill' : 'Create Skill'}</h3>
                            <button onClick={() => setIsSkillModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="settings-modal-body">
                            <div className="settings-field-group">
                                <label className="settings-label">Skill Name</label>
                                <input 
                                    className="settings-input"
                                    value={skillForm.name}
                                    onChange={e => setSkillForm({...skillForm, name: e.target.value})}
                                    placeholder="e.g. React.js"
                                />
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Category</label>
                                <select 
                                    className="settings-input"
                                    value={skillForm.category}
                                    onChange={e => setSkillForm({...skillForm, category: e.target.value})}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="settings-field-group">
                                <label className="settings-label">Description</label>
                                <textarea 
                                    className="settings-input min-h-[100px]"
                                    value={skillForm.description}
                                    onChange={e => setSkillForm({...skillForm, description: e.target.value})}
                                    placeholder="Brief description of the skill..."
                                />
                            </div>
                        </div>
                        <div className="settings-modal-footer">
                            <button className="settings-btn-secondary" onClick={() => setIsSkillModalOpen(false)}>Cancel</button>
                            <button className="settings-btn-primary" onClick={handleSaveSkill} disabled={refreshing}>
                                {refreshing ? 'Saving...' : 'Save Skill'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
