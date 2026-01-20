'use client';

import React, { useState, useEffect } from 'react';
import {
    Clock, Play, Pause, RotateCcw,
    ArrowRight, LogIn, LogOut,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import './ClockAttendanceWidget.css';

export default function ClockAttendanceWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // NEW: Badge collapse state
    const [isMounted, setIsMounted] = useState(false); // NEW: Prevent initial transition
    const [time, setTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('attendance');

    // Stopwatch State
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

    // Attendance State
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);
    const [elapsedWorkTime, setElapsedWorkTime] = useState(0);

    // Mock Attendance History
    const attendanceHistory = [
        { date: 'Oct 23', status: 'Holiday', type: 'holiday', day: 'Wed' },
        { date: 'Oct 22', status: 'Present', type: 'present', in: '09:00 AM', out: '06:00 PM', duration: '9h 00m', day: 'Tue' },
        { date: 'Oct 21', status: 'Absent', type: 'absent', day: 'Mon' },
        { date: 'Oct 20', status: 'Weekend', type: 'weekend', day: 'Sun' },
        { date: 'Oct 19', status: 'Weekend', type: 'weekend', day: 'Sat' },
    ];

    // Live Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Stopwatch Logic
    useEffect(() => {
        let interval;
        if (isStopwatchRunning) {
            interval = setInterval(() => {
                setStopwatchTime((prevTime) => prevTime + 10);
            }, 10);
        }
        return () => clearInterval(interval);
    }, [isStopwatchRunning]);

    // Attendance Work Timer Logic
    useEffect(() => {
        let interval;
        if (isClockedIn) {
            interval = setInterval(() => {
                setElapsedWorkTime((prev) => prev + 1000);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isClockedIn]);

    const handleClockToggle = () => {
        if (!isClockedIn) {
            setIsClockedIn(true);
            setClockInTime(new Date());
        } else {
            setIsClockedIn(false);
        }
    };

    // Load saved state on mount
    useEffect(() => {
        const savedState = localStorage.getItem('clockWidgetCollapsed');
        if (savedState) {
            setIsCollapsed(JSON.parse(savedState));
        }
        // Enable transitions after initial render
        requestAnimationFrame(() => {
            setTimeout(() => setIsMounted(true), 100);
        });
    }, []);

    // Handle collapse toggle (left chevron click)
    const handleCollapseToggle = (e) => {
        e.stopPropagation();
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('clockWidgetCollapsed', JSON.stringify(newState));
    };

    // Handle opening the drawer (clicking on the main badge content)
    const handleOpenDrawer = () => {
        if (!isCollapsed) {
            setIsOpen(true);
        }
    };

    const formatStopwatch = (time) => {
        const minutes = Math.floor((time / 60000) % 60);
        const seconds = Math.floor((time / 1000) % 60);
        const milliseconds = Math.floor((time / 10) % 100);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
    };

    const formatWorkTime = (ms) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Analog Clock Angles
    const secondsDegrees = (time.getSeconds() / 60) * 360;
    const minsDegrees = (time.getMinutes() / 60) * 360 + (time.getSeconds() / 60) * 6;
    const hourDegrees = (time.getHours() % 12 / 12) * 360 + (time.getMinutes() / 60) * 30;

    return (
        <div className="clock-widget-container">
            {/* Badge - Closed State (can be collapsed or expanded) */}
            {!isOpen && (
                <div
                    className={`clock-badge ${isClockedIn ? 'is-active' : ''} ${isCollapsed ? 'is-collapsed' : ''} ${!isMounted ? 'no-transition' : ''}`}
                >
                    {/* Collapse/Expand Handle - Always visible */}
                    <div
                        className="clock-badge__handle"
                        onClick={handleCollapseToggle}
                        title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {isCollapsed ? (
                            <>
                                <span className="clock-badge__handle-text">ATTENDANCE</span>
                                <ChevronLeft size={14} />
                            </>
                        ) : (
                            <ChevronRight size={16} />
                        )}
                    </div>

                    {/* Collapsible Content - Only visible when expanded */}
                    <div className="clock-badge__collapsible" onClick={handleOpenDrawer}>
                        {/* Title Label */}
                        <div className="clock-badge__label">
                            <span>ATTENDANCE</span>
                        </div>

                        {/* Main Content */}
                        <div className="clock-badge__content">
                            <div className="clock-badge__info">
                                <span className="clock-badge__weekday">
                                    {time.toLocaleDateString([], { weekday: 'short' }).toUpperCase()}
                                </span>
                                <span className="clock-badge__date">
                                    {time.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()}
                                </span>
                                <span className="clock-badge__time">
                                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="clock-badge__status">
                            <div className="clock-badge__status-icon">
                                <Clock size={18} />
                            </div>
                            <span className="clock-badge__status-text">
                                {isClockedIn ? 'IN' : 'OUT'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay */}
            {isOpen && (
                <div className="clock-overlay" onClick={() => setIsOpen(false)} />
            )}

            {/* Expanded Drawer */}
            <div className={`clock-drawer ${isOpen ? 'is-open' : ''}`}>
                <div className="clock-drawer__header">
                    <div className="clock-drawer__tabs">
                        <button
                            className={`clock-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                            onClick={() => setActiveTab('attendance')}
                        >
                            Attendance
                        </button>
                        <button
                            className={`clock-tab ${activeTab === 'clock' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clock')}
                        >
                            Clock
                        </button>
                        <button
                            className={`clock-tab ${activeTab === 'stopwatch' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stopwatch')}
                        >
                            Stopwatch
                        </button>
                    </div>
                    <button className="clock-drawer__close" onClick={() => setIsOpen(false)}>
                        <ArrowRight size={18} />
                    </button>
                </div>

                <div className="clock-drawer__content">
                    {activeTab === 'attendance' && (
                        <div className="attendance-view animate-fade-in">
                            <div className="work-timer-card">
                                <span className="work-timer-label">Work Session</span>
                                <span className="work-timer-value">{formatWorkTime(elapsedWorkTime)}</span>
                                <button
                                    className={`attendance-btn ${isClockedIn ? 'clock-out' : 'clock-in'}`}
                                    onClick={handleClockToggle}
                                >
                                    {isClockedIn ? <LogOut size={18} /> : <LogIn size={18} />}
                                    {isClockedIn ? 'Clock Out' : 'Clock In'}
                                </button>
                                {isClockedIn && clockInTime && (
                                    <span className="started-at">
                                        Started at {clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>

                            <div className="attendance-history">
                                <div className="section-header">
                                    <h4>Recent Attendance</h4>
                                    <button className="view-all-link">View All</button>
                                </div>
                                <div className="history-list">
                                    {attendanceHistory.map((record, idx) => (
                                        <div key={idx} className="history-item">
                                            <div className="history-date">
                                                <span className="date-num">{record.date}</span>
                                                <span className="date-day">{record.day}</span>
                                            </div>
                                            <div className="history-details">
                                                {record.type === 'present' ? (
                                                    <div className="time-range">
                                                        <div className="time-point">
                                                            <span className="label in">IN</span>
                                                            <span className="value">{record.in}</span>
                                                        </div>
                                                        <div className="time-divider" />
                                                        <div className="time-point">
                                                            <span className="label out">OUT</span>
                                                            <span className="value">{record.out}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className={`status-tag ${record.type}`}>
                                                        {record.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="history-duration">
                                                {record.type === 'present' ? record.duration : '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clock' && (
                        <div className="clock-view animate-fade-in">
                            <div className="analog-clock">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="hour-mark"
                                        style={{ transform: `rotate(${i * 30}deg)` }}
                                    />
                                ))}
                                <div className="hand hour" style={{ transform: `rotate(${hourDegrees}deg)` }} />
                                <div className="hand minute" style={{ transform: `rotate(${minsDegrees}deg)` }} />
                                <div className="hand second" style={{ transform: `rotate(${secondsDegrees}deg)` }} />
                                <div className="center-dot" />
                            </div>
                            <div className="digital-info">
                                <h2 className="digital-time">
                                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </h2>
                                <h3 className="digital-day">{time.toLocaleDateString([], { weekday: 'long' })}</h3>
                                <p className="digital-date">{time.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="world-clocks">
                                <div className="world-item">
                                    <span>New York</span>
                                    <span>{time.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="world-item">
                                    <span>London</span>
                                    <span>{time.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="world-item">
                                    <span>Tokyo</span>
                                    <span>{time.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stopwatch' && (
                        <div className="stopwatch-view animate-fade-in">
                            <div className="stopwatch-display">
                                {formatStopwatch(stopwatchTime)}
                            </div>
                            <div className="stopwatch-controls">
                                <button
                                    className={`control-btn primary ${isStopwatchRunning ? 'running' : ''}`}
                                    onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                                >
                                    {isStopwatchRunning ? <Pause size={24} /> : <Play size={24} />}
                                </button>
                                <button
                                    className="control-btn secondary"
                                    onClick={() => { setIsStopwatchRunning(false); setStopwatchTime(0); }}
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
