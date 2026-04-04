'use client';

import { useState, useEffect } from 'react';
import { expensesApi } from '@/api/expensesApi';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.getCategories();
      setCategories(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (err) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const res = await expensesApi.updateCategory(editingId, formData);
        setCategories(categories.map(c => c.id === editingId ? res.data : c));
      } else {
        const res = await expensesApi.createCategory(formData);
        setCategories([...categories, res.data]);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      console.error("Save failed", err);
      alert('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await expensesApi.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert('Failed to delete category');
    }
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description || '' });
    setIsModalOpen(true);
  };

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div>
          <h1 className="categories-title">Expense Categories</h1>
          <p className="categories-subtitle">Manage categories for expense classification</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ name: '', description: '' }); }}>
          <Plus size={18} />
          New Category
        </button>
      </div>

      <div className="categories-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="category-card">
            <div className="category-info">
              <h3>{cat.name}</h3>
              <p>{cat.description || 'No description provided.'}</p>
            </div>
            <div className="category-actions">
              <button onClick={() => openEdit(cat)} className="btn-edit"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(cat.id)} className="btn-delete"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;