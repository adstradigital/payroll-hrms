'use client';

import { useEffect, useState } from 'react';
import {
    Code2,
    PenTool,
    Users,
    Plus,
    Edit2,
    Trash2,
    Power,
    RefreshCw,
    X,
    Check,
    Layers3,
    AlertCircle,
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './SkillZone.css';

const EMPTY_SKILL_FORM = {
    name: '',
    category: '',
    description: '',
};

const EMPTY_CATEGORY_FORM = {
    name: '',
    description: '',
};

const getErrorMessage = (error, fallback) => {
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === 'object') {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
    }
    return error?.response?.data?.message || fallback;
};

const getCategoryTheme = (name) => {
    const normalized = (name || '').toLowerCase();

    if (normalized.includes('develop')) {
        return { tone: 'blue', icon: Code2 };
    }
    if (normalized.includes('design')) {
        return { tone: 'violet', icon: PenTool };
    }
    if (normalized.includes('soft')) {
        return { tone: 'green', icon: Users };
    }

    return { tone: 'slate', icon: Layers3 };
};

export default function SkillZone() {
    const [categories, setCategories] = useState([]);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [skillForm, setSkillForm] = useState(EMPTY_SKILL_FORM);
    const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);

    useEffect(() => {
        fetchSkillZone();
    }, []);

    const fetchSkillZone = async () => {
        setLoading(true);
        setError('');

        try {
            const [categoriesResponse, skillsResponse] = await Promise.all([
                recruitmentApi.getSkillCategories(),
                recruitmentApi.getSkills(),
            ]);

            setCategories(categoriesResponse.data?.data || []);
            setSkills(skillsResponse.data?.data || []);
        } catch (fetchError) {
            setError(getErrorMessage(fetchError, 'Failed to load skill zone.'));
        } finally {
            setLoading(false);
        }
    };

    const openCreateSkillModal = (categoryId = '') => {
        setEditingSkill(null);
        setSkillForm({ ...EMPTY_SKILL_FORM, category: categoryId ? String(categoryId) : '' });
        setIsSkillModalOpen(true);
    };

    const openEditSkillModal = (skill) => {
        setEditingSkill(skill);
        setSkillForm({
            name: skill.name,
            category: String(skill.category),
            description: skill.description || '',
        });
        setIsSkillModalOpen(true);
    };

    const closeSkillModal = () => {
        setEditingSkill(null);
        setSkillForm(EMPTY_SKILL_FORM);
        setIsSkillModalOpen(false);
    };

    const openCategoryModal = () => {
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setIsCategoryModalOpen(true);
    };

    const closeCategoryModal = () => {
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setIsCategoryModalOpen(false);
    };

    const handleSaveSkill = async () => {
        if (!skillForm.name.trim() || !skillForm.category) {
            setError('Skill name and category are required.');
            return;
        }

        setSaving(true);
        setError('');

        const payload = {
            name: skillForm.name.trim(),
            category: Number(skillForm.category),
            description: skillForm.description.trim(),
        };

        try {
            if (editingSkill) {
                const response = await recruitmentApi.updateSkill(editingSkill.id, payload);
                setSkills((current) =>
                    current.map((skill) => (skill.id === editingSkill.id ? response.data.data : skill))
                );
            } else {
                const response = await recruitmentApi.createSkill(payload);
                setSkills((current) => [...current, response.data.data]);
            }

            closeSkillModal();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to save skill.'));
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name.trim()) {
            setError('Category name is required.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const response = await recruitmentApi.createSkillCategory({
                name: categoryForm.name.trim(),
                description: categoryForm.description.trim(),
            });
            setCategories((current) =>
                [...current, response.data.data].sort((a, b) => a.name.localeCompare(b.name))
            );
            closeCategoryModal();
        } catch (saveError) {
            setError(getErrorMessage(saveError, 'Failed to create category.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (category) => {
        const categorySkills = getSkillsForCategory(category.id);
        const message =
            categorySkills.length > 0
                ? `Delete "${category.name}" and its ${categorySkills.length} skill(s)?`
                : `Delete "${category.name}"?`;

        if (!window.confirm(message)) {
            return;
        }

        setError('');

        try {
            await recruitmentApi.deleteSkillCategory(category.id);
            setCategories((current) => current.filter((item) => item.id !== category.id));
            setSkills((current) => current.filter((skill) => skill.category !== category.id));
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete category.'));
        }
    };

    const handleDeleteSkill = async (skill) => {
        if (!window.confirm(`Delete "${skill.name}" from the skill library?`)) {
            return;
        }

        setError('');

        try {
            await recruitmentApi.deleteSkill(skill.id);
            setSkills((current) => current.filter((item) => item.id !== skill.id));
        } catch (deleteError) {
            setError(getErrorMessage(deleteError, 'Failed to delete skill.'));
        }
    };

    const handleToggleSkillStatus = async (skill) => {
        setError('');

        try {
            const response = await recruitmentApi.updateSkill(skill.id, { status: !skill.status });
            setSkills((current) =>
                current.map((item) => (item.id === skill.id ? response.data.data : item))
            );
        } catch (toggleError) {
            setError(getErrorMessage(toggleError, 'Failed to update skill status.'));
        }
    };

    const getSkillsForCategory = (categoryId) =>
        skills
            .filter((skill) => skill.category === categoryId)
            .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="skill-zone-page">
            <section className="skill-zone-hero">
                <div>
                    <span className="skill-zone-eyebrow">Recruitment Skills</span>
                    <h2>Skill Zone</h2>
                    <p>Organize technical, design, and soft skills used across jobs, candidates, and matching workflows.</p>
                </div>

                <div className="skill-zone-hero__actions">
                    <button className="skill-zone-btn skill-zone-btn--ghost" onClick={fetchSkillZone} disabled={loading}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button className="skill-zone-btn skill-zone-btn--ghost" onClick={openCategoryModal}>
                        <Layers3 size={16} />
                        Add Category
                    </button>
                    <button className="skill-zone-btn skill-zone-btn--primary" onClick={() => openCreateSkillModal()}>
                        <Plus size={16} />
                        Add New Skill
                    </button>
                </div>
            </section>

            {error && (
                <div className="skill-zone-alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="skill-categories-grid">
                {loading ? (
                    <div className="skill-zone-empty">Loading skills...</div>
                ) : (
                    categories.map((category) => {
                        const categorySkills = getSkillsForCategory(category.id);
                        const theme = getCategoryTheme(category.name);
                        const CategoryIcon = theme.icon;

                        return (
                            <section key={category.id} className="skill-category-column">
                                <div className={`skill-category-header ${theme.tone}`}>
                                    <div className="skill-category-icon">
                                        <CategoryIcon size={18} />
                                    </div>
                                    <div className="skill-category-title">
                                        <h3>{category.name}</h3>
                                        <p>{category.description || 'No category description added yet.'}</p>
                                    </div>
                                    <div className="skill-category-header__actions">
                                        <span className="skill-category-count">{categorySkills.length}</span>
                                        <button
                                            className="skill-icon-btn danger"
                                            type="button"
                                            title="Delete category"
                                            onClick={() => handleDeleteCategory(category)}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <div className="skills-list">
                                    {categorySkills.length === 0 ? (
                                        <div className="skill-zone-empty skill-zone-empty--small">No skills in this category yet.</div>
                                    ) : (
                                        categorySkills.map((skill) => (
                                            <div key={skill.id} className="skill-card">
                                                <div className="skill-info">
                                                    <div className="skill-info__top">
                                                        <h4>{skill.name}</h4>
                                                        <span className={`skill-status ${skill.status ? 'active' : 'inactive'}`}>
                                                            {skill.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <p>{skill.description || 'No skill description added.'}</p>
                                                </div>

                                                <div className="skill-actions">
                                                    <button
                                                        className={`skill-icon-btn ${skill.status ? 'active' : 'inactive'}`}
                                                        type="button"
                                                        title={skill.status ? 'Mark inactive' : 'Mark active'}
                                                        onClick={() => handleToggleSkillStatus(skill)}
                                                    >
                                                        <Power size={15} />
                                                    </button>
                                                    <button
                                                        className="skill-icon-btn"
                                                        type="button"
                                                        title="Edit skill"
                                                        onClick={() => openEditSkillModal(skill)}
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        className="skill-icon-btn danger"
                                                        type="button"
                                                        title="Delete skill"
                                                        onClick={() => handleDeleteSkill(skill)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <button className="skill-add-card-btn" onClick={() => openCreateSkillModal(category.id)}>
                                        <Plus size={14} />
                                        Add to {category.name}
                                    </button>
                                </div>
                            </section>
                        );
                    })
                )}
            </div>

            {isSkillModalOpen && (
                <div className="skill-zone-modal-backdrop" onClick={closeSkillModal}>
                    <div className="skill-zone-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="skill-zone-modal__header">
                            <div>
                                <span className="skill-zone-eyebrow">{editingSkill ? 'Edit Skill' : 'New Skill'}</span>
                                <h3>{editingSkill ? 'Update skill' : 'Add recruitment skill'}</h3>
                            </div>
                            <button className="skill-icon-btn" type="button" onClick={closeSkillModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <label className="skill-zone-field">
                            <span>Skill name</span>
                            <input
                                type="text"
                                value={skillForm.name}
                                onChange={(event) => setSkillForm((current) => ({ ...current, name: event.target.value }))}
                                placeholder="e.g. Django"
                            />
                        </label>

                        <label className="skill-zone-field">
                            <span>Category</span>
                            <select
                                value={skillForm.category}
                                onChange={(event) => setSkillForm((current) => ({ ...current, category: event.target.value }))}
                            >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="skill-zone-field">
                            <span>Description</span>
                            <textarea
                                rows={4}
                                value={skillForm.description}
                                onChange={(event) =>
                                    setSkillForm((current) => ({ ...current, description: event.target.value }))
                                }
                                placeholder="Explain how this skill is used in recruitment."
                            />
                        </label>

                        <div className="skill-zone-modal__footer">
                            <button className="skill-zone-btn skill-zone-btn--ghost" type="button" onClick={closeSkillModal}>
                                Cancel
                            </button>
                            <button className="skill-zone-btn skill-zone-btn--primary" type="button" onClick={handleSaveSkill} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : editingSkill ? 'Save Changes' : 'Create Skill'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCategoryModalOpen && (
                <div className="skill-zone-modal-backdrop" onClick={closeCategoryModal}>
                    <div className="skill-zone-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="skill-zone-modal__header">
                            <div>
                                <span className="skill-zone-eyebrow">New Category</span>
                                <h3>Add skill category</h3>
                            </div>
                            <button className="skill-icon-btn" type="button" onClick={closeCategoryModal}>
                                <X size={16} />
                            </button>
                        </div>

                        <label className="skill-zone-field">
                            <span>Category name</span>
                            <input
                                type="text"
                                value={categoryForm.name}
                                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                                placeholder="e.g. Development"
                            />
                        </label>

                        <label className="skill-zone-field">
                            <span>Description</span>
                            <textarea
                                rows={4}
                                value={categoryForm.description}
                                onChange={(event) =>
                                    setCategoryForm((current) => ({ ...current, description: event.target.value }))
                                }
                                placeholder="Optional category description"
                            />
                        </label>

                        <div className="skill-zone-modal__footer">
                            <button className="skill-zone-btn skill-zone-btn--ghost" type="button" onClick={closeCategoryModal}>
                                Cancel
                            </button>
                            <button className="skill-zone-btn skill-zone-btn--primary" type="button" onClick={handleSaveCategory} disabled={saving}>
                                <Check size={16} />
                                {saving ? 'Saving...' : 'Create Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
