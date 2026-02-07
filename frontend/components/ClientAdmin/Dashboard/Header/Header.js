'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Settings, Globe, ChevronDown, Building2, Check, MapPin } from 'lucide-react';
import ThemeToggle from '@/components/ClientAdmin/Dashboard/ThemeToggle/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import axiosInstance from '@/api/axiosInstance';
import { CLIENTADMIN_ENDPOINTS } from '@/api/config';
import './Header.css';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
    { code: 'ar', label: 'العربية', flag: '🇦🇪' }
];

export default function Header({ title, subtitle, breadcrumbs = [] }) {
    const router = useRouter();
    const { user } = useAuth();
    const { language, changeLanguage, t } = useLanguage();
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD';

    // Company selector state
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [enableGlobalSearch, setEnableGlobalSearch] = useState(true);
    const companyDropdownRef = useRef(null);
    const languageDropdownRef = useRef(null);

    // Fetch companies for the organization
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await axiosInstance.get(CLIENTADMIN_ENDPOINTS.ORGANIZATION);
                const org = response.data?.organization;

                console.log('🔍 Organization data:', org);
                console.log('🔍 enable_global_search value:', org?.enable_global_search);

                if (org) {
                    // Set global search setting
                    const searchEnabled = org.enable_global_search ?? true;
                    console.log('🔍 Setting enableGlobalSearch to:', searchEnabled);
                    setEnableGlobalSearch(searchEnabled);

                    // Always set current org as selected
                    const currentCompany = {
                        id: org.id,
                        name: org.name,
                        logo: org.logo,
                        isParent: true
                    };
                    setSelectedCompany(currentCompany);

                    // Check if organization has subsidiaries
                    if (org.subsidiaries && org.subsidiaries.length > 0) {
                        // Include parent org + subsidiaries
                        const allCompanies = [
                            currentCompany,
                            ...org.subsidiaries.map(sub => ({
                                id: sub.id,
                                name: sub.name,
                                logo: sub.logo,
                                isParent: false
                            }))
                        ];
                        setCompanies(allCompanies);

                        // Set selected company from localStorage or default to first
                        const savedCompanyId = localStorage.getItem('selectedCompanyId');
                        const savedCompany = allCompanies.find(c => c.id === savedCompanyId);
                        if (savedCompany) {
                            setSelectedCompany(savedCompany);
                        }
                    } else {
                        // If no subsidiaries, `companies` should contain only the parent.
                        setCompanies([currentCompany]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch companies:', error);
            }
        };

        fetchCompanies();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setShowCompanyDropdown(false);
            }
            if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
                setShowLanguageDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCompanySelect = (company) => {
        setSelectedCompany(company);
        localStorage.setItem('selectedCompanyId', company.id);
        setShowCompanyDropdown(false);
        // Optionally reload data for the new company
        window.location.reload();
    };

    const getCompanyInitials = (name) => {
        return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'CO';
    };

    return (
        <header className="header">
            <div className="header__left">
                {/* Breadcrumbs & Title Stack */}
                <div className="header__brand">
                    <nav className="header__breadcrumbs">
                        {breadcrumbs.map((crumb, index) => (
                            <span key={index} className="header__breadcrumb">
                                {crumb}
                                {index < breadcrumbs.length - 1 && (
                                    <span className="header__breadcrumb-separator">›</span>
                                )}
                            </span>
                        ))}
                    </nav>
                    <h1 className="header__title">{title || breadcrumbs[breadcrumbs.length - 1]}</h1>
                </div>
            </div>

            {enableGlobalSearch && (
                <div className="header__center">
                    {/* Centered Search */}
                    <div className="header__search">
                        <Search size={16} className="header__search-icon" />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            className="header__search-input"
                        />
                    </div>
                </div>
            )}

            <div className="header__right">
                {/* Company Selector - Always show organization name */}
                {selectedCompany && (
                    <div className="header__company-selector" ref={companyDropdownRef}>
                        <button
                            className="header__company-btn"
                            onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                        >
                            <div className="header__company-icon">
                                {selectedCompany?.logo ? (
                                    <img src={selectedCompany.logo} alt={selectedCompany.name} />
                                ) : (
                                    <Building2 size={12} />
                                )}
                            </div>
                            <span className="header__company-name">{selectedCompany?.name}</span>
                            <ChevronDown size={12} className={showCompanyDropdown ? 'rotated' : ''} />
                        </button>

                        {showCompanyDropdown && (
                            <div className="header__company-dropdown">
                                <div className="header__company-dropdown-header">
                                    <span>Companies</span>
                                </div>
                                <div className="header__company-list">
                                    {companies.map((company) => (
                                        <button
                                            key={company.id}
                                            className={`header__company-item ${selectedCompany?.id === company.id ? 'active' : ''}`}
                                            onClick={() => handleCompanySelect(company)}
                                        >
                                            <div className="header__company-item-icon">
                                                {company.logo ? (
                                                    <img src={company.logo} alt={company.name} />
                                                ) : (
                                                    <span>{company.name?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="header__company-item-info">
                                                <div className="header__company-item-row">
                                                    <span className="header__company-item-name">{company.name}</span>
                                                    {company.isParent && (
                                                        <span className="header__company-item-badge">Parent</span>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedCompany?.id === company.id && (
                                                <Check size={16} className="header__company-item-check" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Country Selector */}
                <button className="header__utility-btn header__country">
                    <MapPin size={14} />
                    <span>IN</span>
                    <ChevronDown size={12} />
                </button>

                {/* Language Switcher */}
                <div className="header__language-selector" ref={languageDropdownRef}>
                    <button
                        className="header__utility-btn header__language"
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    >
                        <Globe size={14} />
                        <span>{language.toUpperCase()}</span>
                        <ChevronDown size={12} className={showLanguageDropdown ? 'rotated' : ''} />
                    </button>

                    {showLanguageDropdown && (
                        <div className="header__language-dropdown glass-panel animate-slide-up">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    className={`header__language-item ${language === lang.code ? 'active' : ''}`}
                                    onClick={() => {
                                        changeLanguage(lang.code);
                                        setShowLanguageDropdown(false);
                                    }}
                                >
                                    <span className="lang-flag">{lang.flag}</span>
                                    <span className="lang-label">{lang.label}</span>
                                    {language === lang.code && <Check size={14} className="check-icon" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Settings */}
                <button
                    className="header__utility-btn"
                    onClick={() => router.push('/dashboard/settings')}
                    title="Settings"
                >
                    <Settings size={14} />
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <button className="header__utility-btn">
                    <Bell size={14} />
                    <span className="header__notification-dot"></span>
                </button>

                {/* User Section */}
                <div className="header__divider"></div>
                <div className="header__user">
                    <div className="header__avatar">{initials}</div>
                </div>
            </div>
        </header>
    );
}
