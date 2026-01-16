import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import { Users, Clock, Calendar, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import './dashboard-page.css';

export const metadata = {
    title: 'Dashboard | HRMS Payroll',
};

export default function DashboardPage() {
    const stats = [
        {
            label: 'Total Employees',
            value: '156',
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'primary'
        },
        {
            label: 'Present Today',
            value: '142',
            change: '91%',
            trend: 'up',
            icon: Clock,
            color: 'success'
        },
        {
            label: 'On Leave',
            value: '8',
            change: '5%',
            trend: 'down',
            icon: Calendar,
            color: 'warning'
        },
        {
            label: 'Payroll This Month',
            value: '₹24.5L',
            change: '+3%',
            trend: 'up',
            icon: Wallet,
            color: 'info'
        },
    ];

    return (
        <Dashboard
            title="Dashboard"
            subtitle="Welcome back! Here's your company overview."
            breadcrumbs={['Dashboard']}
        >
            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`stat-card stat-card--${stat.color}`}>
                            <div className="stat-card__icon">
                                <Icon size={24} />
                            </div>
                            <div className="stat-card__info">
                                <span className="stat-card__label">{stat.label}</span>
                                <span className="stat-card__value">{stat.value}</span>
                            </div>
                            <div className={`stat-card__change stat-card__change--${stat.trend}`}>
                                {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {stat.change}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section">
                <h3 className="section-title">Quick Actions</h3>
                <div className="quick-actions">
                    <button className="quick-action-btn">
                        <Users size={20} />
                        Add Employee
                    </button>
                    <button className="quick-action-btn">
                        <Clock size={20} />
                        Mark Attendance
                    </button>
                    <button className="quick-action-btn">
                        <Calendar size={20} />
                        Apply Leave
                    </button>
                    <button className="quick-action-btn">
                        <Wallet size={20} />
                        Run Payroll
                    </button>
                </div>
            </div>
        </Dashboard>
    );
}
