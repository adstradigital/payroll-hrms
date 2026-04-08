'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, AlertCircle } from 'lucide-react';
import * as supportApi from '@/api/supportApi';
import './CreateTicketForm.css';

export default function CreateTicketForm() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        subject: '',
        priority: 'medium',
        category: '',
        description: '',
    });
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const data = await supportApi.getCategories();
                const catsArray = data.results || data;
                setCategories(catsArray);
                if (Array.isArray(catsArray) && catsArray.length > 0) {
                    setFormData(prev => ({ ...prev, category: catsArray[0].id }));
                }
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        };
        fetchCats();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject || !formData.description) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const ticket = await supportApi.createTicket(formData);

            if (files.length > 0) {
                await Promise.all(
                    files.map(file => supportApi.uploadAttachment(ticket.id, file))
                );
            }

            // Redirect to ticket list with success flag
            router.push(`/dashboard/support/tickets?created=true`);
        } catch (err) {
            setError('Failed to create ticket. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-ticket">
            <div className="create-ticket__header">
                <button
                    className="create-ticket__back-btn"
                    onClick={() => router.push('/dashboard/support/tickets')}
                >
                    <ArrowLeft size={16} />
                    <span>Back to Tickets</span>
                </button>
                <div className="create-ticket__header-content">
                    <h1>Create New Ticket</h1>
                    <p>Tell us about your issue and we'll get back to you as soon as possible.</p>
                </div>
            </div>

            {error && (
                <div className="create-ticket__error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="create-ticket__form-card">
                <form onSubmit={handleSubmit}>
                    <div className="create-ticket__form-group">
                        <label htmlFor="subject">
                            Subject <span className="create-ticket__required">*</span>
                        </label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Briefly describe the issue"
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="create-ticket__form-group">
                            <label htmlFor="priority">
                                Priority <span className="create-ticket__required">*</span>
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="create-ticket__form-group">
                            <label htmlFor="category">
                                Category <span className="create-ticket__required">*</span>
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                {Array.isArray(categories) && categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="create-ticket__form-group">
                        <label htmlFor="description">
                            Description <span className="create-ticket__required">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Explain the problem in detail..."
                            rows={6}
                            required
                        />
                        <span className="create-ticket__char-count">
                            {formData.description.length} characters
                        </span>
                    </div>

                    <div className="create-ticket__form-group">
                        <label>Attachments (Optional)</label>
                        <div className="create-ticket__file-upload">
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                onChange={handleFileChange}
                                className="create-ticket__file-input"
                            />
                            <label htmlFor="file-upload" className="create-ticket__file-label">
                                <Upload size={16} />
                                Choose Files
                            </label>
                            <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                Max 5 files. Max size 5MB per file.
                            </p>
                        </div>

                        {files.length > 0 && (
                            <div className="create-ticket__file-list">
                                {files.map((file, index) => (
                                    <div key={index} className="create-ticket__file-item">
                                        <span className="create-ticket__file-name">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="create-ticket__file-remove"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="create-ticket__form-actions">
                        <button
                            type="button"
                            className="create-ticket__cancel-btn"
                            onClick={() => router.push('/dashboard/support/tickets')}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-ticket__submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
