"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    Check, Users, Calendar, DollarSign,
    FileText, Shield, BarChart, ArrowRight,
    ChevronUp, Zap, Lock, Globe, Star,
    TrendingUp, Clock, Award, Play, ChevronRight,
    Menu, X, Sparkles, Building2, MousePointer2
} from 'lucide-react';

/**
 * Custom hook for intersection observer animations
 */
function useScrollReveal() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
}

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 py-4 ${isScrolled ? 'top-0' : 'top-2'
            }`}>
            <div className={`max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5 rounded-full transition-all duration-500 border ${isScrolled
                ? 'bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.04)]'
                : 'bg-transparent border-transparent'
                }`}>
                <div className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                        H
                    </div>
                    <span className="font-bold text-lg tracking-tighter text-slate-900">HRMS<span className="text-blue-600">.</span></span>
                </div>

                <div className="hidden md:flex items-center gap-7 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {['Home', 'Features', 'Pricing', 'Enquiry'].map(item => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-blue-600 transition-colors">{item}</a>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <a href="/login" className="hidden sm:block text-[11px] font-black text-slate-900 px-4 py-2 hover:text-blue-600 transition-colors uppercase tracking-[0.2em]">
                        Log In
                    </a>
                    <a href="/register" className="bg-slate-900 text-white text-[11px] font-black px-5 py-2.5 rounded-full hover:bg-blue-600 shadow-xl shadow-slate-200 hover:shadow-blue-100 transition-all active:scale-95 uppercase tracking-[0.2em]">
                        Get Started
                    </a>
                    <button
                        className="md:hidden p-2 text-slate-900"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="absolute top-20 left-4 right-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl md:hidden animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col gap-5 text-xs font-black text-slate-800 uppercase tracking-widest">
                        {['Home', 'Features', 'Pricing', 'Enquiry'].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}>{item}</a>
                        ))}
                        <a href="/register" className="w-full py-4 bg-blue-600 text-white rounded-2xl text-center inline-block">Start Trial</a>
                    </div>
                </div>
            )}
        </nav>
    );
};

const SectionHeader = ({ tag, title, subtitle, centered = true }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div
            ref={ref}
            className={`mb-12 transition-all duration-700 ${centered ? 'text-center' : 'text-left'} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
        >
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] uppercase tracking-[0.3em] font-black mb-5 shadow-lg shadow-slate-100 ${centered ? '' : 'ml-1'}`}>
                <Sparkles size={10} className="text-blue-400" />
                {tag}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1] mb-5">
                {title}
            </h2>
            <p className={`text-base md:text-lg text-slate-500 font-medium max-w-xl ${centered ? 'mx-auto' : ''}`}>
                {subtitle}
            </p>
        </div>
    );
};

const BentoCard = ({ title, description, icon: Icon, color, className = "", delay = 0 }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`group relative overflow-hidden bg-white border border-slate-100 rounded-[2rem] p-7 transition-all duration-700 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:border-blue-100 hover:-translate-y-1 ${className} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
        >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110 shadow-sm`} style={{ backgroundColor: `${color}08`, color: color, border: `1px solid ${color}15` }}>
                <Icon size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2.5 tracking-tight group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed opacity-85">{description}</p>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-blue-400/10 rounded-[2rem]"></div>
        </div>
    );
};

export default function LandingPage() {
    const [enquirySent, setEnquirySent] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowBackToTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleEnquiry = (e) => {
        e.preventDefault();
        setEnquirySent(true);
        setTimeout(() => setEnquirySent(false), 5000);
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className="min-h-screen bg-[#FAFAFC] selection:bg-blue-600 selection:text-white font-sans text-slate-900 antialiased">
            <Navbar />

            {/* Hero Section */}
            <header className="relative pt-24 pb-16 md:pt-40 md:pb-24 overflow-hidden" id="home">
                <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[70%] bg-blue-50/40 blur-[140px] rounded-full pointer-events-none" />
                <div className="absolute top-[10%] right-[-5%] w-[40%] h-[60%] bg-sky-50/40 blur-[140px] rounded-full pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/60 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-1000">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        New: Integrated Payroll Module
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-[-0.04em] text-slate-900 mb-6 leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                        Simplify Your <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-blue-700 to-sky-600">HR & Payroll</span> Operations.
                    </h1>

                    <p className="max-w-xl mx-auto text-base md:text-lg text-slate-500 font-semibold mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                        The all-in-one platform to manage employees, attendance, leaves, and payroll processing with ease. Built for modern, high-growth teams.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-14 duration-1000 delay-300 mb-16">
                        <a href="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-sm font-black rounded-2xl shadow-2xl shadow-blue-100 hover:bg-blue-700 hover:translate-y-[-2px] transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                            Start Free Trial
                            <ArrowRight size={16} />
                        </a>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 text-sm font-black border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                            Explore Features
                        </a>
                    </div>

                    {/* Hero Stats */}
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 mb-16 border-y border-slate-100 py-8 animate-in fade-in duration-1000 delay-500">
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-slate-900">10K+</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Users</span>
                        </div>
                        <div className="w-px h-10 bg-slate-100 hidden md:block" />
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-slate-900">99.9%</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uptime SLA</span>
                        </div>
                        <div className="w-px h-10 bg-slate-100 hidden md:block" />
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-slate-900">50+</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Integrations</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 opacity-40">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Trusted by teams at</span>
                        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
                            {['Acme Corp', 'NovaHR', 'FinFlow', 'TechBase', 'PeopleFirst'].map(brand => (
                                <span key={brand} className="text-lg font-black text-slate-800 tracking-tighter">{brand}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Bento Grid Features */}
            <section className="py-20 px-6 max-w-6xl mx-auto" id="features">
                <SectionHeader
                    tag="Features"
                    title="Everything You Need"
                    subtitle="Powerful, integrated tools to run your entire HR operation from one place."
                />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <BentoCard
                        className="md:col-span-4"
                        icon={DollarSign}
                        title="Payroll Management"
                        description="Automated salary calculations, payslip generation, and tax deductions in one click."
                        color="blue-600"
                        delay={0}
                    />
                    <BentoCard
                        className="md:col-span-4"
                        icon={Users}
                        title="Employee Database"
                        description="Centralized records for all employee details, documents, and complete work history."
                        color="#db2777"
                        delay={50}
                    />
                    <BentoCard
                        className="md:col-span-4"
                        icon={Calendar}
                        title="Attendance & Leave"
                        description="Real-time tracking, biometric integration, and automated leave workflows."
                        color="#0ea5e9"
                        delay={100}
                    />
                    <BentoCard
                        className="md:col-span-8"
                        icon={Zap}
                        title="Automation Engine"
                        description="Set up workflows that run automatically — from onboarding to payroll finalization. Our engine ensures your HR processes move at the speed of your business."
                        color="blue-600"
                        delay={150}
                    />
                    <BentoCard
                        className="md:col-span-4"
                        icon={FileText}
                        title="Document Management"
                        description="Securely store and manage employee contracts, IDs, and certificates."
                        color="#10b981"
                        delay={200}
                    />
                    <BentoCard
                        className="md:col-span-4"
                        icon={Shield}
                        title="Role-Based Access"
                        description="Granular permissions to ensure data security across your organization."
                        color="#f59e0b"
                        delay={250}
                    />
                    <BentoCard
                        className="md:col-span-4"
                        icon={BarChart}
                        title="Smart Reports"
                        description="Gain specific insights with detailed analytics and exportable reports."
                        color="#ef4444"
                        delay={300}
                    />
                    <BentoCard
                        className="md:col-span-4"
                        icon={Globe}
                        title="Multi-Company Support"
                        description="Manage multiple legal entities and branches under one account."
                        color="#06b6d4"
                        delay={350}
                    />
                    <BentoCard
                        className="md:col-span-12"
                        icon={TrendingUp}
                        title="Performance Tracking"
                        description="Set goals, run review cycles, and link performance directly to payroll outcomes. Create a culture of high performance with transparent metrics."
                        color="blue-500"
                        delay={400}
                    />
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-6 bg-slate-900 rounded-[3rem] mx-4 md:mx-6 my-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Award size={300} />
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <SectionHeader
                        tag="Testimonials"
                        title={<span className="text-white">Loved by HR Teams</span>}
                        subtitle={<span className="text-slate-400">See what teams around the world are saying about HRMS Payroll.</span>}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        {[
                            { q: "Running payroll used to take us 3 days. Now it's done in under 2 hours. The automation is incredible.", a: "Priya Sharma", r: "HR Director, Acme Corp" },
                            { q: "The attendance tracking and leave management alone has saved us 10+ hours every month. Worth every rupee.", a: "Rahul Mehta", r: "CFO, NovaHR" },
                            { q: "Onboarding employees across multiple branches is a breeze now. Best HRMS we've ever used.", a: "Anjali Verma", r: "People Ops Lead, FinFlow" }
                        ].map((t, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm">
                                <div className="flex gap-1 mb-6">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="#f59e0b" className="text-amber-500" />)}
                                </div>
                                <p className="text-lg font-medium leading-relaxed mb-8 italic">"{t.q}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs uppercase">
                                        {t.a.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{t.a}</p>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t.r}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-6 max-w-6xl mx-auto" id="pricing">
                <SectionHeader
                    tag="Pricing"
                    title="Simple, Transparent Pricing"
                    subtitle="No hidden fees. Choose the plan that fits your team size."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            name: 'Starter', price: '0',
                            desc: 'Perfect for small teams getting started.',
                            features: ['Up to 10 Employees', 'Basic HRMS', 'Attendance Tracking', 'Standard Support'],
                            popular: false
                        },
                        {
                            name: 'Pro', price: '49',
                            desc: 'For growing companies needing more power.',
                            features: ['Up to 50 Employees', 'Full Payroll Suite', 'Document Management', 'Priority Support', 'Advanced Reports', 'API Access'],
                            popular: true
                        },
                        {
                            name: 'Enterprise', price: '199',
                            desc: 'Scalable solution for large organizations.',
                            features: ['Unlimited Employees', 'Custom Roles', 'Dedicated Account Manager', 'API Access', 'SSO Integration', 'Custom Integrations'],
                            popular: false
                        }
                    ].map((plan, i) => (
                        <div key={plan.name} className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 ${plan.popular
                            ? 'bg-white border-blue-600 shadow-[0_20px_50px_rgba(99,102,241,0.1)] scale-[1.03] z-10'
                            : 'bg-white/40 border-slate-200'
                            }`}>
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">{plan.desc}</p>

                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-xl font-bold text-slate-400">$</span>
                                <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-1">/mo</span>
                            </div>

                            <div className="space-y-3.5 mb-8 flex-grow">
                                {plan.features.map(feat => (
                                    <div key={feat} className="flex items-center gap-3 text-slate-600 font-bold text-[12px] tracking-tight">
                                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                        {feat}
                                    </div>
                                ))}
                            </div>

                            <button className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${plan.popular
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}>
                                {plan.price === '0' ? 'Get Started Free' : 'Subscribe Now'}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Enquiry Section */}
            <section className="py-20 px-6 max-w-4xl mx-auto mb-16" id="enquiry">
                <div className="bg-white border border-slate-200/60 rounded-[3rem] p-8 md:p-14 shadow-xl shadow-slate-100/50 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50/50 blur-3xl rounded-full" />

                    <div className="text-center mb-10 relative z-10">
                        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">Contact</div>
                        <h2 className="text-3xl font-black tracking-tight mb-3">Ready to Transform Your HR?</h2>
                        <p className="text-slate-500 font-semibold text-sm">Get in touch with our team for a personalized demo.</p>
                    </div>

                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10" onSubmit={handleEnquiry}>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                            <input type="text" placeholder="John Doe" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:outline-none transition-all font-bold text-xs tracking-widest uppercase" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Email</label>
                            <input type="email" placeholder="john@company.com" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:outline-none transition-all font-bold text-xs tracking-widest uppercase" required />
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Size</label>
                            <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:outline-none transition-all font-bold text-xs tracking-widest uppercase text-slate-500">
                                <option value="">Select team size...</option>
                                <option>1–10 employees</option>
                                <option>11–50 employees</option>
                                <option>51–200 employees</option>
                                <option>200+ employees</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message</label>
                            <textarea placeholder="Tell us about your requirements..." rows="3" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:outline-none transition-all font-bold text-xs tracking-widest uppercase resize-none"></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${enquirySent
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg hover:shadow-blue-100'
                                    }`}
                            >
                                {enquirySent ? '✓ Message Sent!' : 'Request a Demo'}
                                {!enquirySent && <MousePointer2 size={14} />}
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 pt-16 pb-10 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">H</div>
                                <span className="font-bold text-lg tracking-tighter text-slate-900">HRMS Payroll</span>
                            </div>
                            <p className="text-slate-400 font-bold text-[13px] leading-relaxed mb-6">
                                Modern HR & Payroll for high-growth teams. Built for the era of remote and hybrid work.
                            </p>
                            <div className="flex gap-4">
                                {[Globe, Lock, Shield].map((Icon, i) => (
                                    <div key={i} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                                        <Icon size={16} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-20">
                            <div>
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-900 mb-6">Product</h4>
                                <ul className="space-y-3 text-slate-400 font-bold text-[13px]">
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Payroll</li>
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Attendance</li>
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Documents</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-900 mb-6">Legal</h4>
                                <ul className="space-y-3 text-slate-400 font-bold text-[13px]">
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Privacy Policy</li>
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Terms of Service</li>
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Security</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-900 mb-6">Resources</h4>
                                <ul className="space-y-3 text-slate-400 font-bold text-[13px]">
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Support</li>
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">Blog</li>
                                    <li className="hover:text-blue-600 cursor-pointer transition-colors">API Docs</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                        <p>© 2026 HRMS Payroll Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <span className="hover:text-slate-900 cursor-pointer transition-colors">Social</span>
                            <span className="hover:text-slate-900 cursor-pointer transition-colors">Status</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Back to Top */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 w-12 h-12 bg-white text-slate-900 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 z-50 border border-slate-100 hover:bg-blue-600 hover:text-white group ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
                aria-label="Back to top"
            >
                <ChevronUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
        </div>
    );
}
