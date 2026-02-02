import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PermissionProvider } from '@/context/PermissionContext';
import { LanguageProvider } from '@/context/LanguageContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'HRMS Payroll',
    description: 'Human Resource Management System with Payroll',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <AuthProvider>
                    <PermissionProvider>
                        <LanguageProvider>
                            <ThemeProvider>
                                {children}
                            </ThemeProvider>
                        </LanguageProvider>
                    </PermissionProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
