'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Search,
    Plus,
    FileText,
    Filter,
    Loader2,
    Edit3,
    Trash2,
    MessageSquare,
    ListPlus,
    BarChart3,
    RefreshCcw,
} from 'lucide-react';
import recruitmentApi from '@/api/recruitmentApi';
import './RecruitmentSurvey.css';

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CLOSED', label: 'Closed' },
];

const QUESTION_TYPES = [
    { value: 'TEXT', label: 'Text' },
    { value: 'RATING', label: 'Rating (1–5)' },
    { value: 'YES_NO', label: 'Yes / No' },
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
];

const EMPTY_SURVEY = { title: '', description: '', status: 'ACTIVE' };
const EMPTY_QUESTION = { question_text: '', question_type: 'TEXT', options: [] };

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
};

function StatusPill({ status }) {
    const normalized = (status || '').toUpperCase();
    return (
        <span className={`survey-status survey-status--${normalized === 'CLOSED' ? 'closed' : 'active'}`}>
            {normalized === 'CLOSED' ? 'Closed' : 'Active'}
        </span>
    );
}

export default function RecruitmentSurvey() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [surveyModalOpen, setSurveyModalOpen] = useState(false);
    const [surveyForm, setSurveyForm] = useState(EMPTY_SURVEY);
    const [surveyFormError, setSurveyFormError] = useState('');
    const [savingSurvey, setSavingSurvey] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState(null);

    const [questionModalOpen, setQuestionModalOpen] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
    const [questionError, setQuestionError] = useState('');
    const [questionSaving, setQuestionSaving] = useState(false);
    const [newOption, setNewOption] = useState('');

    const [responsesModalOpen, setResponsesModalOpen] = useState(false);
    const [responses, setResponses] = useState([]);
    const [responsesLoading, setResponsesLoading] = useState(false);
    const [responsesError, setResponsesError] = useState('');

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await recruitmentApi.getSurveys();
            const items = data?.results || data?.data || data || [];
            setSurveys(items);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load surveys.');
        } finally {
            setLoading(false);
        }
    };

    const filteredSurveys = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return surveys.filter((survey) => {
            const matchesStatus = !statusFilter || survey.status === statusFilter;
            const matchesSearch =
                !term ||
                survey.title?.toLowerCase().includes(term) ||
                survey.description?.toLowerCase().includes(term);
            return matchesStatus && matchesSearch;
        });
    }, [surveys, statusFilter, searchTerm]);

    const totalResponses = useMemo(
        () => surveys.reduce((sum, survey) => sum + (survey.response_count || 0), 0),
        [surveys]
    );

    const openCreateModal = () => {
        setSurveyForm(EMPTY_SURVEY);
        setSurveyFormError('');
        setEditingSurvey(null);
        setSurveyModalOpen(true);
    };

    const openEditModal = (survey) => {
        setSurveyForm({
            title: survey.title || '',
            description: survey.description || '',
            status: survey.status || 'ACTIVE',
        });
        setSurveyFormError('');
        setEditingSurvey(survey);
        setSurveyModalOpen(true);
    };

    const handleSurveySubmit = async () => {
        if (!surveyForm.title.trim()) {
            setSurveyFormError('Survey title is required.');
            return;
        }
        setSavingSurvey(true);
        setSurveyFormError('');
        try {
            let response;
            if (editingSurvey) {
                response = await recruitmentApi.updateSurvey(editingSurvey.id, surveyForm);
            } else {
                response = await recruitmentApi.createSurvey(surveyForm);
            }
            await fetchSurveys();
            setSurveyModalOpen(false);
            setEditingSurvey(null);

            if (!editingSurvey && response?.data?.data) {
                setSelectedSurvey(response.data.data);
                setQuestionForm(EMPTY_QUESTION);
                setQuestions([]);
                setQuestionModalOpen(true);
            }
        } catch (err) {
            setSurveyFormError(err?.response?.data?.message || 'Unable to save survey. Please try again.');
        } finally {
            setSavingSurvey(false);
        }
    };

    const handleDeleteSurvey = async (survey) => {
        const confirmed = window.confirm(`Delete survey "${survey.title}"?`);
        if (!confirmed) return;
        try {
            await recruitmentApi.deleteSurvey(survey.id);
            setSurveys((prev) => prev.filter((item) => item.id !== survey.id));
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to delete survey.');
        }
    };

    const loadQuestions = async (surveyId) => {
        setQuestionsLoading(true);
        setQuestionError('');
        try {
            const { data } = await recruitmentApi.getSurveyQuestions(surveyId);
            const items = data?.data || data?.results || data || [];
            setQuestions(items);
        } catch (err) {
            setQuestionError(err?.response?.data?.message || 'Unable to load questions.');
        } finally {
            setQuestionsLoading(false);
        }
    };

    const openQuestionModal = async (survey) => {
        setSelectedSurvey(survey);
        setQuestionModalOpen(true);
        setQuestionForm(EMPTY_QUESTION);
        setNewOption('');
        await loadQuestions(survey.id);
    };

    const addOption = () => {
        if (!newOption.trim()) return;
        setQuestionForm((prev) => ({
            ...prev,
            options: [...prev.options, newOption.trim()],
        }));
        setNewOption('');
    };

    const removeOption = (option) => {
        setQuestionForm((prev) => ({
            ...prev,
            options: prev.options.filter((opt) => opt !== option),
        }));
    };

    const handleAddQuestion = async () => {
        if (!selectedSurvey) return;
        if (!questionForm.question_text.trim()) {
            setQuestionError('Question text is required.');
            return;
        }
        if (questionForm.question_type === 'MULTIPLE_CHOICE' && questionForm.options.length === 0) {
            setQuestionError('Add at least one option for multiple choice questions.');
            return;
        }
        setQuestionSaving(true);
        setQuestionError('');
        try {
            const payload = {
                question_text: questionForm.question_text,
                question_type: questionForm.question_type,
                options: questionForm.question_type === 'MULTIPLE_CHOICE' ? questionForm.options : [],
            };
            const { data } = await recruitmentApi.addSurveyQuestion(selectedSurvey.id, payload);
            const newQuestion = data?.data || data;
            setQuestions((prev) => [...prev, newQuestion]);
            setQuestionForm(EMPTY_QUESTION);
            setNewOption('');
        } catch (err) {
            setQuestionError(err?.response?.data?.message || 'Failed to add question.');
        } finally {
            setQuestionSaving(false);
        }
    };

    const openResponsesModal = async (survey) => {
        setSelectedSurvey(survey);
        setResponsesModalOpen(true);
        setResponsesLoading(true);
        setResponsesError('');
        try {
            const { data } = await recruitmentApi.getSurveyResponses(survey.id, { page_size: 100 });
            const items = data?.results || data?.data || data || [];
            setResponses(items);
        } catch (err) {
            setResponsesError(err?.response?.data?.message || 'Unable to load responses.');
        } finally {
            setResponsesLoading(false);
        }
    };

    const closeAllModals = () => {
        setSurveyModalOpen(false);
        setQuestionModalOpen(false);
        setResponsesModalOpen(false);
        setEditingSurvey(null);
        setSelectedSurvey(null);
        setSurveyFormError('');
        setQuestionError('');
        setResponsesError('');
    };

    return (
        <div className="recruitment-survey">
            <div className="survey-hero">
                <div>
                    <span className="survey-eyebrow">Recruitment Surveys</span>
                    <h2>Collect feedback from candidates and interviewers</h2>
                    <p>Launch quick polls, track responses, and continuously improve your hiring process.</p>
                    <div className="survey-stats">
                        <div className="survey-stat">
                            <strong>{surveys.length}</strong>
                            <span>Surveys</span>
                        </div>
                        <div className="survey-stat">
                            <strong>{surveys.reduce((sum, s) => sum + (s.question_count || 0), 0)}</strong>
                            <span>Questions</span>
                        </div>
                        <div className="survey-stat">
                            <strong>{totalResponses}</strong>
                            <span>Responses</span>
                        </div>
                    </div>
                </div>
                <div className="survey-actions">
                    <button className="survey-btn survey-btn--ghost" onClick={fetchSurveys}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                    <button className="survey-btn survey-btn--primary" onClick={openCreateModal}>
                        <Plus size={16} /> Create New Survey
                    </button>
                </div>
            </div>

            <div className="survey-toolbar">
                <div className="survey-search">
                    <Search size={16} className="survey-search__icon" />
                    <input
                        type="text"
                        placeholder="Search by title or description"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="survey-filter">
                    <Filter size={16} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="survey-alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="survey-table-wrap">
                <table className="survey-table">
                    <thead>
                        <tr>
                            <th>Survey Title</th>
                            <th>Questions</th>
                            <th>Responses</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th style={{ width: 210 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="survey-empty">
                                    <Loader2 size={18} className="spin" /> Loading surveys...
                                </td>
                            </tr>
                        ) : filteredSurveys.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="survey-empty">
                                    No surveys match your filters.
                                </td>
                            </tr>
                        ) : (
                            filteredSurveys.map((survey) => (
                                <tr key={survey.id}>
                                    <td>
                                        <div className="survey-title">
                                            <div className="survey-icon">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <strong>{survey.title}</strong>
                                                <p>{survey.description || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{survey.question_count ?? 0}</td>
                                    <td>{survey.response_count ?? 0}</td>
                                    <td><StatusPill status={survey.status} /></td>
                                    <td>{formatDate(survey.created_at)}</td>
                                    <td>
                                        <div className="survey-row-actions">
                                            <button className="survey-chip" onClick={() => openQuestionModal(survey)}>
                                                <ListPlus size={14} /> Questions
                                            </button>
                                            <button className="survey-chip" onClick={() => openResponsesModal(survey)}>
                                                <MessageSquare size={14} /> Responses
                                            </button>
                                            <button className="survey-chip" onClick={() => openEditModal(survey)}>
                                                <Edit3 size={14} /> Edit
                                            </button>
                                            <button className="survey-chip danger" onClick={() => handleDeleteSurvey(survey)}>
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {surveyModalOpen && (
                <div className="survey-modal-backdrop" onClick={closeAllModals}>
                    <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="survey-modal__header">
                            <div>
                                <p className="survey-modal__eyebrow">{editingSurvey ? 'Edit Survey' : 'New Survey'}</p>
                                <h3>{editingSurvey ? 'Update Survey' : 'Create Survey'}</h3>
                            </div>
                            <button className="survey-modal__close" onClick={closeAllModals}>×</button>
                        </div>
                        <div className="survey-modal__body">
                            <label>
                                Survey Title <span className="required">*</span>
                                <input
                                    type="text"
                                    value={surveyForm.title}
                                    onChange={(e) => setSurveyForm((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="Candidate Experience Survey"
                                />
                            </label>
                            <label>
                                Description
                                <textarea
                                    rows={3}
                                    value={surveyForm.description}
                                    onChange={(e) => setSurveyForm((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Why are you running this survey?"
                                />
                            </label>
                            <label>
                                Status
                                <select
                                    value={surveyForm.status}
                                    onChange={(e) => setSurveyForm((prev) => ({ ...prev, status: e.target.value }))}
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {surveyFormError && <div className="survey-form-error">{surveyFormError}</div>}
                        </div>
                        <div className="survey-modal__footer">
                            <button className="survey-btn survey-btn--ghost" onClick={closeAllModals}>
                                Cancel
                            </button>
                            <button className="survey-btn survey-btn--primary" onClick={handleSurveySubmit} disabled={savingSurvey}>
                                {savingSurvey ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Save Survey'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {questionModalOpen && selectedSurvey && (
                <div className="survey-modal-backdrop" onClick={closeAllModals}>
                    <div className="survey-modal survey-modal--wide" onClick={(e) => e.stopPropagation()}>
                        <div className="survey-modal__header">
                            <div>
                                <p className="survey-modal__eyebrow">Questions</p>
                                <h3>{selectedSurvey.title}</h3>
                                <p className="muted">{selectedSurvey.description || 'Survey questions'}</p>
                            </div>
                            <button className="survey-modal__close" onClick={closeAllModals}>×</button>
                        </div>

                        <div className="survey-modal__body survey-modal__grid">
                            <div className="question-list">
                                <div className="question-list__title">
                                    <BarChart3 size={16} /> Existing Questions
                                    <span className="pill">{questions.length}</span>
                                </div>
                                {questionsLoading ? (
                                    <div className="survey-empty inline">
                                        <Loader2 size={16} className="spin" /> Loading questions...
                                    </div>
                                ) : questions.length === 0 ? (
                                    <div className="survey-empty inline">No questions yet.</div>
                                ) : (
                                    <ul className="question-items">
                                        {questions.map((question, index) => (
                                            <li key={question.id || index}>
                                                <div>
                                                    <p className="question-text">{question.question_text}</p>
                                                    <span className="question-type">
                                                        {QUESTION_TYPES.find((qt) => qt.value === question.question_type)?.label || question.question_type}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="question-form">
                                <div className="question-form__title">
                                    <ListPlus size={16} /> Add Question
                                </div>
                                <label>
                                    Question Text <span className="required">*</span>
                                    <textarea
                                        rows={3}
                                        value={questionForm.question_text}
                                        onChange={(e) =>
                                            setQuestionForm((prev) => ({ ...prev, question_text: e.target.value }))
                                        }
                                        placeholder="How would you rate the interview process?"
                                    />
                                </label>

                                <label>
                                    Question Type
                                    <select
                                        value={questionForm.question_type}
                                        onChange={(e) =>
                                            setQuestionForm((prev) => ({ ...prev, question_type: e.target.value }))
                                        }
                                    >
                                        {QUESTION_TYPES.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {questionForm.question_type === 'MULTIPLE_CHOICE' && (
                                    <div className="option-builder">
                                        <div className="option-input">
                                            <input
                                                type="text"
                                                value={newOption}
                                                onChange={(e) => setNewOption(e.target.value)}
                                                placeholder="Add option"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addOption();
                                                    }
                                                }}
                                            />
                                            <button type="button" className="survey-chip" onClick={addOption}>
                                                Add
                                            </button>
                                        </div>
                                        <div className="option-chips">
                                            {questionForm.options.map((option) => (
                                                <span key={option} className="survey-chip">
                                                    {option}
                                                    <button onClick={() => removeOption(option)}>×</button>
                                                </span>
                                            ))}
                                            {questionForm.options.length === 0 && (
                                                <p className="muted">Add options for this question.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {questionError && <div className="survey-form-error">{questionError}</div>}

                                <div className="question-actions">
                                    <button className="survey-btn survey-btn--ghost" onClick={() => setQuestionForm(EMPTY_QUESTION)}>
                                        Clear
                                    </button>
                                    <button
                                        className="survey-btn survey-btn--primary"
                                        onClick={handleAddQuestion}
                                        disabled={questionSaving}
                                    >
                                        {questionSaving ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Add Question'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {responsesModalOpen && selectedSurvey && (
                <div className="survey-modal-backdrop" onClick={closeAllModals}>
                    <div className="survey-modal survey-modal--wide" onClick={(e) => e.stopPropagation()}>
                        <div className="survey-modal__header">
                            <div>
                                <p className="survey-modal__eyebrow">Responses</p>
                                <h3>{selectedSurvey.title}</h3>
                            </div>
                            <button className="survey-modal__close" onClick={closeAllModals}>×</button>
                        </div>

                        <div className="survey-modal__body">
                            {responsesError && (
                                <div className="survey-alert" role="alert">
                                    <AlertCircle size={18} />
                                    <span>{responsesError}</span>
                                </div>
                            )}
                            {responsesLoading ? (
                                <div className="survey-empty inline">
                                    <Loader2 size={16} className="spin" /> Loading responses...
                                </div>
                            ) : responses.length === 0 ? (
                                <div className="survey-empty inline">No responses yet.</div>
                            ) : (
                                <div className="responses-grid">
                                    {responses.map((response) => (
                                        <div key={response.id} className="response-card">
                                            <div className="response-card__header">
                                                <div className="response-avatar">
                                                    {(response.candidate_details?.full_name ||
                                                        response.interviewer_name ||
                                                        'A')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="response-title">
                                                        {response.candidate_details?.full_name ||
                                                            response.interviewer_name ||
                                                            'Anonymous'}
                                                    </p>
                                                    <p className="response-subtitle">
                                                        Submitted on {formatDate(response.submitted_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="response-answers">
                                                {response.answers?.map((answer) => (
                                                    <div key={answer.id} className="answer-chip">
                                                        <p className="answer-question">{answer.question_text}</p>
                                                        <p className="answer-value">{answer.answer_text || '—'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
