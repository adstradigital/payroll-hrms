'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from '@/api/config';
import { toast } from 'react-hot-toast';
import './ats.css';

const ResumeUploader = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setResults(null); 
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    });

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await axiosInstance.post(CLIENTADMIN_ENDPOINTS.CANDIDATE_BULK_UPLOAD, formData);
            if (response.data.success) {
                toast.success(response.data.message);
                setResults(response.data.results);
                setFiles([]);
                if (onUploadSuccess) onUploadSuccess();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload resumes');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="resume-uploader">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
            
            <div 
                {...getRootProps()} 
                className={`uploader-dropzone ${isDragActive ? 'active' : ''}`}
            >
                <input {...getInputProps()} />
                <motion.div 
                    animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="uploader-icon-container">
                        <Upload className="uploader-icon" />
                    </div>
                    <h2 className="uploader-title">Intelligence-Driven Bulk Upload</h2>
                    <p className="uploader-subtitle">
                        Drop your PDF or Word resumes here. Our AI will automatically extract 
                        candidate names, emails, and phone numbers.
                    </p>
                </motion.div>
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="file-list"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
                                Selected Entities ({files.length})
                            </h3>
                            <button 
                                onClick={handleUpload}
                                disabled={uploading}
                                className="ats-upload-trigger inactive"
                                style={{ padding: '0.5rem 1.75rem', fontSize: '0.85rem' }}
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                <span>{uploading ? 'Analyzing...' : 'Start Extraction'}</span>
                            </button>
                        </div>

                        <div className="custom-scrollbar" style={{ maxHeight: '12rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {files.map((file, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="file-item"
                                >
                                    <div className="file-info">
                                        <FileText className="w-5 h-5" style={{ color: 'var(--ats-accent)' }} />
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="remove-file-btn">
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {results && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="upload-results"
                >
                    <div className="results-header">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                            <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 800 }}>Analysis Report</h3>
                        </div>
                        <button 
                            onClick={() => setResults(null)} 
                            className="ats-action-btn" 
                            style={{ background: 'transparent', border: 'none', fontSize: '11px', fontWeight: 700, color: 'var(--ats-text-muted)' }}
                        >
                            CLEAR REPORT
                        </button>
                    </div>
                    <div className="results-list">
                        {results.map((res: any, i: number) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`result-item ${res.success ? 'success' : 'error'}`}
                            >
                                {res.success ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                <span style={{ flex: 1 }}>
                                    {res.file}: <span style={{ opacity: 0.8 }}>{res.message || `Parsed ${res.name}`}</span>
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ResumeUploader;
