'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import './NavBar.css';

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        setIsMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
            <div className="landing-nav__container">
                {/* Logo */}
                <Link href="/" className="nav-logo">
                    <div className="logo-icon">H</div>
                    <span className="logo-text">HRMS Payroll</span>
                </Link>

                {/* Desktop Menu */}
                <div className="nav-menu">
                    <button onClick={() => scrollToSection('home')} className="nav-link">Home</button>
                    <button onClick={() => scrollToSection('features')} className="nav-link">Features</button>
                    <button onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
                    <button onClick={() => scrollToSection('enquiry')} className="nav-link">Contact</button>
                </div>

                {/* Desktop Actions */}
                <div className="nav-actions">
                    <Link href="/login" className="btn-login">
                        Log In
                    </Link>
                    <button onClick={() => scrollToSection('pricing')} className="btn-demo">
                        Get Started
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
                <button onClick={() => scrollToSection('home')} className="mobile-nav-link">Home</button>
                <button onClick={() => scrollToSection('features')} className="mobile-nav-link">Features</button>
                <button onClick={() => scrollToSection('pricing')} className="mobile-nav-link">Pricing</button>
                <button onClick={() => scrollToSection('enquiry')} className="mobile-nav-link">Contact</button>

                <div className="mobile-actions">
                    <Link href="/login" className="mobile-login">
                        Log In
                    </Link>
                    <button onClick={() => scrollToSection('pricing')} className="mobile-demo">
                        Get Started
                    </button>
                </div>
            </div>
        </nav>
    );
}
