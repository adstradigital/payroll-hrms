'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, UserPlus, CalendarPlus,
    DollarSign, Zap
} from 'lucide-react';
import './FloatingQuickActions.css';

const FloatingQuickActions = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState(null); // {x, y}
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleWindowMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const newX = e.clientX - dragOffset.current.x;
            const newY = e.clientY - dragOffset.current.y;

            // Constrain within viewport
            const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 60));
            const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 60));

            setPos({ x: boundedX, y: boundedY });
        };

        const handleWindowMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isDragging]);

    const onMouseDown = (e) => {
        if (!wrapperRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();

        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        startPos.current = { x: e.clientX, y: e.clientY };
        setIsDragging(true);

        if (!pos) {
            setPos({ x: rect.left, y: rect.top });
        }
    };

    const handleClick = (e) => {
        const dist = Math.sqrt(
            Math.pow(e.clientX - startPos.current.x, 2) +
            Math.pow(e.clientY - startPos.current.y, 2)
        );

        if (dist < 5) {
            setIsOpen(!isOpen);
        }
    };

    const style = pos
        ? { left: `${pos.x}px`, top: `${pos.y}px`, bottom: 'auto', right: 'auto' }
        : { bottom: '2rem', right: '2rem' };

    const actions = [
        { icon: UserPlus, label: 'Add Employee', className: '', path: '/dashboard/employees' },
        { icon: CalendarPlus, label: 'Leave Request', className: 'item--success', path: '/dashboard/leave?tab=requests' },
        { icon: DollarSign, label: 'Run Payroll', className: 'item--warning', path: '/dashboard/payroll/run' },
        { icon: Zap, label: 'Audit Logs', className: 'item--info', path: '/dashboard/logs' },
    ];

    const handleActionClick = (path) => {
        setIsOpen(false);
        router.push(path);
    };

    return (
        <div
            ref={wrapperRef}
            className={`floating-actions ${isDragging ? 'dragging' : ''} ${isOpen ? 'open' : ''}`}
            style={style}
        >
            {/* Action Buttons Stack */}
            <div className="floating-actions__menu">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.label}
                            type="button"
                            className={`floating-actions__item ${action.className}`.trim()}
                            style={{ '--index': index }}
                            title={action.label}
                            onClick={() => handleActionClick(action.path)}
                        >
                            <Icon size={20} />
                            <span className="floating-actions__tooltip">{action.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Toggle Button */}
            <button
                onMouseDown={onMouseDown}
                onClick={handleClick}
                className="floating-actions__trigger"
                aria-label="Toggle Quick Actions"
            >
                <Plus size={28} className="trigger-icon" />
                {!isOpen && !isDragging && (
                    <div className="trigger-hint">Drag to move</div>
                )}
            </button>
        </div>
    );
};

export default FloatingQuickActions;
