'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, HelpCircle, FileText, Users, Settings, Zap, BookOpen, MessageSquare } from 'lucide-react';
import * as supportApi from '@/api/supportApi';
import './HelpCenter.css';

export default function HelpCenter() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [featuredArticles, setFeaturedArticles] = useState([]);
    const [popularArticles, setPopularArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Icon mapping for categories
    const iconMap = {
        'help-circle': HelpCircle,
        'file-text': FileText,
        'users': Users,
        'settings': Settings,
        'zap': Zap,
        'book-open': BookOpen,
        'message-square': MessageSquare,
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [categoriesData, featuredData, popularData] = await Promise.all([
                supportApi.getCategories(),
                supportApi.getFeaturedArticles(),
                supportApi.getPopularArticles(),
            ]);
            setCategories(categoriesData);
            setFeaturedArticles(featuredData);
            setPopularArticles(popularData);
        } catch (err) {
            setError('Failed to load help center data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/dashboard/support/help-center?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleArticleClick = (slug) => {
        router.push(`/dashboard/support/article/${slug}`);
    };

    const handleCategoryClick = (slug) => {
        router.push(`/dashboard/support/help-center?category=${slug}`);
    };

    if (loading) {
        return (
            <div className="help-center">
                <div className="help-center__loading">
                    <div className="spinner"></div>
                    <p>Loading help center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="help-center">
            {/* Header Section */}
            <div className="help-center__header">
                <h1>Help Center</h1>
                <p>Find answers to your questions and get support</p>

                {/* Search Bar */}
                <form className="help-center__search" onSubmit={handleSearch}>
                    <Search className="help-center__search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search for articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            {error && (
                <div className="help-center__error">
                    {error}
                </div>
            )}

            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
                <section className="help-center__section">
                    <h2>Featured Articles</h2>
                    <div className="help-center__featured-grid">
                        {featuredArticles.map((article) => (
                            <div
                                key={article.id}
                                className="help-center__featured-card"
                                onClick={() => handleArticleClick(article.slug)}
                            >
                                <div className="help-center__featured-card-icon">
                                    <FileText size={24} />
                                </div>
                                <h3>{article.title}</h3>
                                <p className="help-center__featured-card-category">
                                    {article.category_name}
                                </p>
                                <div className="help-center__featured-card-meta">
                                    <span>{article.view_count} views</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Browse by Category */}
            {categories.length > 0 && (
                <section className="help-center__section">
                    <h2>Browse by Category</h2>
                    <div className="help-center__category-grid">
                        {categories.map((category) => {
                            const IconComponent = iconMap[category.icon] || HelpCircle;
                            return (
                                <div
                                    key={category.id}
                                    className="help-center__category-card"
                                    onClick={() => handleCategoryClick(category.slug)}
                                >
                                    <div className="help-center__category-icon">
                                        <IconComponent size={32} />
                                    </div>
                                    <h3>{category.name}</h3>
                                    <p>{category.description}</p>
                                    <span className="help-center__category-count">
                                        {category.article_count} articles
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Popular Articles */}
            {popularArticles.length > 0 && (
                <section className="help-center__section">
                    <h2>Popular Articles</h2>
                    <div className="help-center__popular-list">
                        {popularArticles.map((article, index) => (
                            <div
                                key={article.id}
                                className="help-center__popular-item"
                                onClick={() => handleArticleClick(article.slug)}
                            >
                                <div className="help-center__popular-number">{index + 1}</div>
                                <div className="help-center__popular-content">
                                    <h4>{article.title}</h4>
                                    <p>{article.category_name}</p>
                                </div>
                                <div className="help-center__popular-views">
                                    {article.view_count} views
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Video Tutorials Section */}
            <section className="help-center__section">
                <h2>Video Tutorials</h2>
                <div className="help-center__video-grid">
                    {[
                        { title: 'Getting Started with Payroll', duration: '5:20', thumbnail: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
                        { title: 'Managing Employee Leave', duration: '3:45', thumbnail: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' },
                        { title: 'Generating Monthly Reports', duration: '8:10', thumbnail: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' },
                    ].map((video, index) => (
                        <div key={index} className="help-center__video-card">
                            <div className="help-center__video-thumbnail" style={{ background: video.thumbnail }}>
                                <div className="help-center__play-button">▶</div>
                                <span className="help-center__video-duration">{video.duration}</span>
                            </div>
                            <h3>{video.title}</h3>
                            <button className="help-center__video-link">Watch Tutorial</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="help-center__section">
                <h2>Frequently Asked Questions</h2>
                <div className="help-center__faq-grid">
                    {[
                        { q: 'How do I reset my password?', a: 'Go to account settings and click on "Change Password". Follow the email instructions.' },
                        { q: 'Can I download payslips in bulk?', a: 'Yes, navigate to Reports > Payroll > Payslips and select "Bulk Download".' },
                        { q: 'How to add a new employee?', a: 'Admins can add employees from the "Employees" tab. Click "+ Add Employee" and fill details.' },
                        { q: 'What happens if approval is delayed?', a: 'Pending requests auto-escalate after 48 hours based on your configured policies.' },
                    ].map((faq, index) => (
                        <div key={index} className="help-center__faq-item">
                            <div className="help-center__faq-icon">?</div>
                            <div className="help-center__faq-content">
                                <h4>{faq.q}</h4>
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Box */}
            <section className="help-center__cta">
                <div className="help-center__cta-content">
                    <MessageSquare size={48} />
                    <h2>Still need help?</h2>
                    <p>Can't find what you're looking for? Create a support ticket and our team will get back to you.</p>
                    <button
                        className="help-center__cta-button"
                        onClick={() => router.push('/dashboard/support/tickets/new')}
                    >
                        Create Support Ticket
                    </button>
                </div>
            </section>
        </div>
    );
}
