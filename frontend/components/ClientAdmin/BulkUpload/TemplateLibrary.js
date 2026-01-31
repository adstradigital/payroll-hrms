'use client';

import { useState, useEffect } from 'react';
import { Download, FileDown, ShieldCheck, CreditCard, Users, Clock, FileText } from 'lucide-react';
import * as bulkUploadApi from '@/api/bulkUploadApi';

import './TemplateLibrary.css';

export default function TemplateLibrary() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await bulkUploadApi.getTemplates();
            // Filter out hidden sections: tax, reimbursement, loan
            const hiddenTypes = ['tax', 'reimbursement', 'loan'];
            setTemplates(data.filter(t => !hiddenTypes.includes(t.id)));
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'employee': return Users;
            case 'salary': return CreditCard;
            case 'attendance': return Clock;
            case 'tax': return FileText;
            case 'reimbursement': return FileDown;
            case 'loan': return ShieldCheck;
            default: return FileText;
        }
    };

    const handleDownload = (templateId) => {
        bulkUploadApi.downloadTemplate(templateId);
    };

    return (
        <div className="bu-templates">
            <header className="bu-templates__header">
                <h1>Download Templates</h1>
                <p>Standardized CSV and Excel templates for data import</p>
            </header>

            {loading ? (
                <div className="bu-templates__loading">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="bu-templates__grid">
                    {templates.map(template => {
                        const Icon = getIcon(template.id);
                        return (
                            <div key={template.id} className="bu-template-card">
                                <div className="bu-template-card__header">
                                    <div className="bu-template-icon">
                                        <Icon size={24} />
                                    </div>
                                    <div className="bu-template-version">{template.version}</div>
                                </div>
                                <h3>{template.name}</h3>
                                <p>{template.description}</p>
                                <div className="bu-template-meta">
                                    Last updated: {new Date(template.lastUpdated).toLocaleDateString()}
                                </div>
                                <div className="bu-template-actions">
                                    <button
                                        className="bu-btn-primary"
                                        onClick={() => handleDownload(template.id)}
                                    >
                                        <Download size={16} /> Template
                                    </button>
                                    <button
                                        className="bu-btn-secondary"
                                        onClick={() => handleDownload(`${template.id}_sample`)}
                                    >
                                        Sample Data
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
