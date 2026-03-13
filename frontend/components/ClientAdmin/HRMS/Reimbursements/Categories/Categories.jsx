'use client';

import { useState, useEffect } from 'react';
import { mockCategories } from '@/api/reimbursementsApi';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import './Categories.css';

const Categories = () => {

  const [categories,setCategories] = useState([]);
  const [formData,setFormData] = useState({name:'',description:''});
  const [editingId,setEditingId] = useState(null);
  const [loading,setLoading] = useState(false);
  const [isModalOpen,setIsModalOpen] = useState(false);

  useEffect(()=>{
    setCategories(mockCategories);
  },[]);

  const handleInputChange = (e)=>{
    setFormData({...formData,[e.target.name]:e.target.value});
  };

  const handleSubmit = (e)=>{
    e.preventDefault();
    setLoading(true);

    if(editingId){
      setCategories(categories.map(cat =>
        cat.id === editingId ? {...cat,...formData} : cat
      ));
      setEditingId(null);
    }else{
      const newCat = {id:Date.now(),...formData};
      setCategories([...categories,newCat]);
    }

    setFormData({name:'',description:''});
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleEdit = (cat)=>{
    setFormData({name:cat.name,description:cat.description});
    setEditingId(cat.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id)=>{
    if(confirm('Delete category?')){
      setCategories(categories.filter(cat=>cat.id!==id));
    }
  };

  return (
    <div className="categories">

      <div className="categories-header">
        <h2>Expense Categories</h2>

        <button 
          className="add-btn"
          onClick={()=>setIsModalOpen(true)}
        >
          <Plus size={18}/> Add Category
        </button>
      </div>

      <div className="categories-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th style={{width:'120px'}}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map(cat=>(
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>{cat.description}</td>
                <td className="actions">
                  
                  <button
                    className="icon-btn edit"
                    onClick={()=>handleEdit(cat)}
                  >
                    <Pencil size={16}/>
                  </button>

                  <button
                    className="icon-btn delete"
                    onClick={()=>handleDelete(cat.id)}
                  >
                    <Trash2 size={16}/>
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}

      {isModalOpen && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">
              <h3>{editingId ? 'Edit Category' : 'Add Category'}</h3>

              <button
                className="close-btn"
                onClick={()=>setIsModalOpen(false)}
              >
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={()=>setIsModalOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" disabled={loading} className="submit-btn">
                  {editingId ? 'Update' : 'Create'}
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