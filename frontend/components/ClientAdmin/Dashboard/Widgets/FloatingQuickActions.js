'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, UserPlus, CalendarPlus,
    DollarSign, Zap, Move
} from 'lucide-react';
import './FloatingQuickActions.css';

const FloatingQuickActions = () => {
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

    return (
        <div
            ref={wrapperRef}
            className={`floating-actions ${isDragging ? 'dragging' : ''} ${isOpen ? 'open' : ''}`}
            style={style}
        >
            {/* Action Buttons Stack */}
            <div className="floating-actions__menu">
                <button className="floating-actions__item" style={{ '--index': 0 }} title="Add Employee">
                    <UserPlus size={20} />
                    <span className="floating-actions__tooltip">Add Employee</span>
                </button>
                <button className="floating-actions__item item--success" style={{ '--index': 1 }} title="Leave Request">
                    <CalendarPlus size={20} />
                    <span className="floating-actions__tooltip">Leave Request</span>
                </button>
                <button className="floating-actions__item item--warning" style={{ '--index': 2 }} title="Run Payroll">
                    <DollarSign size={20} />
                    <span className="floating-actions__tooltip">Run Payroll</span>
                </button>
                <button className="floating-actions__item item--info" style={{ '--index': 3 }} title="Audit Logs">
                    <Zap size={20} />
                    <span className="floating-actions__tooltip">Audit Logs</span>
                </button>
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
