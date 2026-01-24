'use client';

import { useState } from 'react';
import NavBar from './NavBar/NavBar';
import {
    Check, Users, Calendar, DollarSign,
    FileText, Shield, BarChart, ArrowRight
} from 'lucide-react';
import './Landingpage.css';

export default function LandingPage() {
    const [enquirySent, setEnquirySent] = useState(false);

    const handleEnquiry = (e) => {
        e.preventDefault();
        setEnquirySent(true);
        // Add actual API call here later
        setTimeout(() => setEnquirySent(false), 5000);
    };

    return (
        <div className="landing-page" id="home">
            <NavBar />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg-glow"></div>
                <div className="hero-content">
                    <span className="hero-badge">New: Integrated Payroll Module</span>
                    <h1 className="hero-title">
                        Simplify Your <br />
                        <span>HR & Payroll</span> Operations
                    </h1>
                    <p className="hero-desc">
                        The all-in-one platform to manage employees, attendance, leaves, and payroll processing with ease. Designed for modern teams.
                    </p>
                    <div className="hero-buttons">
                        <a href="#pricing" className="btn-demo">Start Free Trial</a>
                        <a href="#features" className="btn-login" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            View Features
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section" id="features">
                <div className="section-header">
                    <h2 className="section-title">Everything You Need</h2>
                    <p className="section-subtitle">Powerful tools to streamline your workforce management.</p>
                </div>

                <div className="features-grid">
                    <FeatureCard
                        icon={DollarSign}
                        title="Payroll Management"
                        desc="Automated salary calculations, payslip generation, and tax deductions in one click."
                    />
                    <FeatureCard
                        icon={Users}
                        title="Employee Database"
                        desc="Centralized records for all employee details, documents, and history."
                    />
                    <FeatureCard
                        icon={Calendar}
                        title="Attendance & Leave"
                        desc="Real-time tracking, biometric integration, and automated leave workflows."
                    />
                    <FeatureCard
                        icon={FileText}
                        title="Document Management"
                        desc="Securely store and manage employee contracts, IDs, and certificates."
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Role-Based Access"
                        desc="Granular permissions to ensure data security across your organization."
                    />
                    <FeatureCard
                        icon={BarChart}
                        title="Smart Reports"
                        desc="Gain specific insights with detailed analytics and exportable reports."
                    />
                </div>
            </section>

            {/* Pricing Section */}
            <section className="section" id="pricing">
                <div className="section-header">
                    <h2 className="section-title">Simple, Transparent Pricing</h2>
                    <p className="section-subtitle">Choose the plan that fits your team size.</p>
                </div>

                <div className="pricing-grid">
                    <PricingCard
                        title="Starter"
                        price="0"
                        desc="Perfect for small teams getting started."
                        features={['Up to 10 Employees', 'Basic HRMS', 'Attendance Tracking', 'Standard Support']}
                    />
                    <PricingCard
                        title="Pro"
                        price="49"
                        desc="For growing companies needing more power."
                        isPopular
                        features={['Up to 50 Employees', 'Full Payroll Suite', 'Document Management', 'Priority Support', 'Advanced Reports']}
                    />
                    <PricingCard
                        title="Enterprise"
                        price="199"
                        desc="Scalable solution for large organizations."
                        features={['Unlimited Employees', 'Custom Roles', 'Dedicated Account Manager', 'API Access', 'SSO Integration']}
                    />
                </div>
            </section>

            {/* Enquiry Section */}
            <section className="section" id="enquiry">
                <div className="enquiry-container">
                    <h2 className="section-title">Ready to Transform Your HR?</h2>
                    <p className="section-subtitle">Get in touch with our sales team for a custom demo.</p>

                    <form className="enquiry-form" onSubmit={handleEnquiry}>
                        <div className="input-group">
                            <input type="text" placeholder="Full Name" className="form-input" required />
                        </div>
                        <div className="input-group">
                            <input type="email" placeholder="Work Email" className="form-input" required />
                        </div>
                        <div className="input-group">
                            <textarea placeholder="Tell us about your requirements..." className="form-input form-textarea"></textarea>
                        </div>
                        <button type="submit" className="btn-submit">
                            {enquirySent ? 'Message Sent!' : 'Request Demo'}
                        </button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <span className="footer-logo">HRMS Payroll</span>
                <div className="footer-links">
                    <a href="#" className="footer-link">Privacy Policy</a>
                    <a href="#" className="footer-link">Terms of Service</a>
                    <a href="#" className="footer-link">Support</a>
                </div>
                <p>&copy; 2026 HRMS Payroll Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }) {
    return (
        <div className="feature-card">
            <div className="feature-icon">
                <Icon size={24} />
            </div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{desc}</p>
        </div>
    );
}

function PricingCard({ title, price, desc, features, isPopular }) {
    return (
        <div className={`pricing-card ${isPopular ? 'popular' : ''}`}>
            {isPopular && <span className="popular-badge">Most Popular</span>}
            <h3 className="price-title">{title}</h3>
            <div className="price-amount">
                <span style={{ fontSize: '1.5rem', verticalAlign: 'top' }}>$</span>
                {price}
                <span className="price-period">/mo</span>
            </div>
            <p className="price-desc">{desc}</p>
            <ul className="price-features">
                {features.map((feat, i) => (
                    <li key={i}>
                        <Check size={18} className="check-icon" />
                        {feat}
                    </li>
                ))}
            </ul>
            <button className="btn-price">{price === '0' ? 'Get Started' : 'Subscribe Now'}</button>
        </div>
    );
}
