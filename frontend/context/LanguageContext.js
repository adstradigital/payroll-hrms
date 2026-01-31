'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Priority: localStorage > browser language > 'en'
    const [language, setLanguage] = useState('en');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        if (savedLang && translations[savedLang]) {
            setLanguage(savedLang);
        } else {
            const browserLang = navigator.language.split('-')[0];
            if (translations[browserLang]) {
                setLanguage(browserLang);
            }
        }
        setIsReady(true);
    }, []);

    const changeLanguage = (lang) => {
        if (translations[lang]) {
            setLanguage(lang);
            localStorage.setItem('language', lang);

            // Handle RTL for Arabic
            if (lang === 'ar') {
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = 'ar';
            } else {
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = lang;
            }
        }
    };

    // Helper function to get translation
    // Usage: t('common.dashboard')
    const t = (path, replacements = {}) => {
        const keys = path.split('.');
        let translation = translations[language];

        for (const key of keys) {
            if (translation && translation[key]) {
                translation = translation[key];
            } else {
                // Fallback to English if current language translation missing
                let englishFallback = translations['en'];
                for (const fallbackKey of keys) {
                    if (englishFallback && englishFallback[fallbackKey]) {
                        englishFallback = englishFallback[fallbackKey];
                    } else {
                        return path; // Return key if all fails
                    }
                }
                translation = englishFallback;
                break;
            }
        }

        // Handle replacements like {count}
        if (typeof translation === 'string') {
            Object.keys(replacements).forEach(key => {
                translation = translation.replace(`{${key}}`, replacements[key]);
            });
        }

        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, isReady }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
