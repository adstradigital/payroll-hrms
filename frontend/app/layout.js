import { ThemeProvider } from '../context/ThemeContext';
import '../styles/globals.css';

export const metadata = {
    title: 'Payroll & HRMS SaaS',
    description: 'Comprehenisve HR and Payroll solution',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
