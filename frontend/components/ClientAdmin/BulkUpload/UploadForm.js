'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import './UploadForm.css';

export default function UploadForm({ type, onUpload, loading }) {
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [skipErrors, setSkipErrors] = useState(false);
    const [progress, setProgress] = useState(0);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file) => {
        // Simple validation logic (can be expanded)
        const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        // Note: MIME type checking can be tricky on frontend, so we often rely on extensions or strict checks
        if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
            alert('Please upload a valid CSV or Excel file.');
            return;
        }
        setFile(file);
        setProgress(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        // Simulate progress for UI feedback
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        try {
            await onUpload(file, skipErrors);
            setProgress(100);
        } catch (error) {
            setProgress(0);
        } finally {
            clearInterval(interval);
        }
    };

    const removeFile = () => {
        setFile(null);
        setProgress(0);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <form className="bu-upload-form" onSubmit={handleSubmit}>
            <div
                className={`bu-drop-zone ${dragActive ? 'bu-drop-zone--active' : ''} ${file ? 'bu-drop-zone--has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="bu-file-input"
                    onChange={handleChange}
                    accept=".csv,.xlsx,.xls"
                />

                {!file ? (
                    <div className="bu-drop-zone__content">
                        <div className="bu-upload-icon-circle">
                            <UploadCloud size={32} />
                        </div>
                        <h3>Click to upload or drag and drop</h3>
                        <p>Supported formats: CSV, Excel (xlsx)</p>
                        <p className="bu-max-size">Max file size: 10MB</p>
                    </div>
                ) : (
                    <div className="bu-file-preview">
                        <div className="bu-file-icon">
                            <File size={32} />
                        </div>
                        <div className="bu-file-info">
                            <span className="bu-file-name">{file.name}</span>
                            <span className="bu-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                            {progress > 0 && (
                                <div className="bu-progress-bar">
                                    <div className="bu-progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            )}
                        </div>
                        <button type="button" className="bu-remove-file" onClick={(e) => { e.stopPropagation(); removeFile(); }}>
                            <X size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div className="bu-form-options">
                <label className="bu-checkbox-label">
                    <input
                        type="checkbox"
                        checked={skipErrors}
                        onChange={(e) => setSkipErrors(e.target.checked)}
                    />
                    <span>Skip rows with errors and continue upload</span>
                </label>
            </div>

            <button
                type="submit"
                className={`bu-submit-btn ${loading ? 'bu-submit-btn--loading' : ''}`}
                disabled={!file || loading}
            >
                {loading ? 'Uploading...' : 'Start Upload'}
            </button>
        </form>
    );
}
