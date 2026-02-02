'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, AlertCircle } from 'lucide-react';
import * as supportApi from '@/api/supportApi';
import './CreateTicketForm.css';

export default function CreateTicketForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        subject: '',
        priority: 'medium',
        description: '',
    });
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
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

            // Create ticket
            const ticket = await supportApi.createTicket(formData);

            // Upload attachments if any
            if (files.length > 0) {
                await Promise.all(
                    files.map(file => supportApi.uploadAttachment(ticket.id, file))
                );
            }

            // Redirect to ticket detail
            router.push(`/dashboard/support/tickets/${ticket.id}`);
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
                    <ArrowLeft size={20} />
                    Back to Tickets
                </button>
                <div className="create-ticket__header-content">
                    <h1>Create Support Ticket</h1>
                    <p>Describe your issue and our support team will get back to you</p>
                </div>
            </div>

            {error && (
                <div className="create-ticket__error">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <form className="create-ticket__form" onSubmit={handleSubmit}>
                <div className="create-ticket__form-card">
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
                            placeholder="Brief description of your issue"
                            required
                        />
                    </div>

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
                            <option value="low">Low - General inquiry</option>
                            <option value="medium">Medium - Normal issue</option>
                            <option value="high">High - Important issue</option>
                            <option value="urgent">Urgent - Critical issue</option>
                        </select>
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
                            placeholder="Provide detailed information about your issue. Include any error messages, steps to reproduce, or relevant context..."
                            rows={10}
                            required
                        />
                        <span className="create-ticket__char-count">
                            {formData.description.length} characters
                        </span>
                    </div>

                    <div className="create-ticket__form-group">
                        <label>Attachments (Optional)</label>
                        <p className="create-ticket__field-hint">
                            Upload screenshots, documents, or any files that help explain your issue
                        </p>
                        <div className="create-ticket__file-upload">
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                onChange={handleFileChange}
                                className="create-ticket__file-input"
                            />
                            <label htmlFor="file-upload" className="create-ticket__file-label">
                                <Upload size={20} />
                                Choose Files
                            </label>
                            <span className="create-ticket__file-hint">
                                Max 5MB per file
                            </span>
                        </div>

                        {files.length > 0 && (
                            <div className="create-ticket__file-list">
                                {files.map((file, index) => (
                                    <div key={index} className="create-ticket__file-item">
                                        <span className="create-ticket__file-name">{file.name}</span>
                                        <span className="create-ticket__file-size">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </span>
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
                        {submitting ? 'Creating Ticket...' : 'Create Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
}
