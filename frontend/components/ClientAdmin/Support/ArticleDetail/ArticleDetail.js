'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';
import * as supportApi from '@/api/supportApi';
import './ArticleDetail.css';

export default function ArticleDetail({ slug }) {
    const router = useRouter();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        if (slug) {
            fetchArticle();
        }
    }, [slug]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const data = await supportApi.getArticleBySlug(slug);
            setArticle(data);
        } catch (err) {
            setError('Failed to load article');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (isHelpful) => {
        try {
            await supportApi.markArticleHelpful(slug, isHelpful);
            setFeedback(isHelpful);
        } catch (err) {
            console.error('Failed to submit feedback:', err);
        }
    };

    if (loading) {
        return (
            <div className="article-detail">
                <div className="article-detail__loading">
                    <div className="spinner"></div>
                    <p>Loading article...</p>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="article-detail">
                <div className="article-detail__error">
                    {error || 'Article not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="article-detail">
            {/* Header */}
            <div className="article-detail__header">
                <button
                    className="article-detail__back-btn"
                    onClick={() => router.push('/dashboard/support/help-center')}
                >
                    <ArrowLeft size={20} />
                    Back to Help Center
                </button>

                <div className="article-detail__title-section">
                    <h1>{article.title}</h1>
                    <div className="article-detail__meta">
                        <span className="article-detail__category">{article.category_name}</span>
                        <span className="article-detail__views">
                            <Eye size={16} />
                            {article.view_count} views
                        </span>
                    </div>
                </div>
            </div>

            <div className="article-detail__layout">
                {/* Main Content */}
                <div className="article-detail__main">
                    <div className="article-detail__content">
                        <div dangerouslySetInnerHTML={{ __html: article.content }} />
                    </div>

                    {/* Feedback Section */}
                    <div className="article-detail__feedback">
                        <h3>Was this article helpful?</h3>
                        {feedback === null ? (
                            <div className="article-detail__feedback-buttons">
                                <button
                                    className="article-detail__feedback-btn article-detail__feedback-btn--yes"
                                    onClick={() => handleFeedback(true)}
                                >
                                    <ThumbsUp size={20} />
                                    Yes, it was helpful
                                </button>
                                <button
                                    className="article-detail__feedback-btn article-detail__feedback-btn--no"
                                    onClick={() => handleFeedback(false)}
                                >
                                    <ThumbsDown size={20} />
                                    No, it wasn't helpful
                                </button>
                            </div>
                        ) : (
                            <div className="article-detail__feedback-thanks">
                                <p>Thank you for your feedback!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                {article.related_articles && article.related_articles.length > 0 && (
                    <aside className="article-detail__sidebar">
                        <h3>Related Articles</h3>
                        <div className="article-detail__related-list">
                            {article.related_articles.map((related) => (
                                <div
                                    key={related.id}
                                    className="article-detail__related-item"
                                    onClick={() => router.push(`/dashboard/support/article/${related.slug}`)}
                                >
                                    <FileText size={20} />
                                    <div>
                                        <h4>{related.title}</h4>
                                        <p>{related.category_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
