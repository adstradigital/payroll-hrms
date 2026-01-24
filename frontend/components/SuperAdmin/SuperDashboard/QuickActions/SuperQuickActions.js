import React, { useState, useEffect } from 'react';
import {
    Users,
    FileText,
    RefreshCw,
    Settings,
    Plus,
    X
} from 'lucide-react';
import './SuperQuickActions.css';

const SuperQuickActions = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
    const [hasInitialized, setHasInitialized] = useState(false);

    // Smart positioning state: 'bottom-right', 'top-right', 'bottom-left', 'top-left'
    const [placement, setPlacement] = useState('bottom-right');

    useEffect(() => {
        // Initial position: Bottom Right with some padding
        const initialX = window.innerWidth - 80;
        const initialY = window.innerHeight - 80;
        setPosition({ x: initialX, y: initialY });
        setHasInitialized(true);
        updatePlacement(initialX, initialY);

        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 60),
                y: Math.min(prev.y, window.innerHeight - 60)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updatePlacement = (x, y) => {
        const isTop = y < window.innerHeight / 2;
        const isLeft = x < window.innerWidth / 2;

        if (isTop && isLeft) setPlacement('top-left');
        else if (isTop && !isLeft) setPlacement('top-right');
        else if (!isTop && isLeft) setPlacement('bottom-left');
        else setPlacement('bottom-right');
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos({ ...position });
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            let newX = initialPos.x + dx;
            let newY = initialPos.y + dy;

            const maxX = window.innerWidth - 60;
            const maxY = window.innerHeight - 60;

            newX = Math.max(10, Math.min(newX, maxX));
            newY = Math.max(10, Math.min(newY, maxY));

            setPosition({ x: newX, y: newY });
            updatePlacement(newX, newY);
        };

        const handleMouseUp = (e) => {
            if (!isDragging) return;
            setIsDragging(false);
            const moveDistance = Math.sqrt(
                Math.pow(e.clientX - dragStart.x, 2) +
                Math.pow(e.clientY - dragStart.y, 2)
            );
            // Only toggle if it wasn't a significant drag
            if (moveDistance < 5) {
                setIsOpen(prev => !prev);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, initialPos]);

    if (!hasInitialized) return null;

    const actions = [
        { icon: Users, label: 'Add User', color: 'action-blue' },
        { icon: FileText, label: 'View Logs', color: 'action-emerald' },
        { icon: RefreshCw, label: 'Sync Data', color: 'action-purple' },
        { icon: Settings, label: 'Settings', color: 'action-zinc' },
    ];

    const isUp = placement.includes('bottom');
    const isLeftMenu = placement.includes('right');

    return (
        <div
            className="fab-container"
            style={{
                left: position.x,
                top: position.y,
                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
        >
            <div className={`fab-menu ${isOpen ? 'open' : ''} ${isUp ? 'expand-up' : 'expand-down'} ${isLeftMenu ? 'align-right' : 'align-left'}`}>
                {actions.map((action, idx) => (
                    <div
                        key={idx}
                        className="fab-action-item"
                        style={{ transitionDelay: isOpen ? `${idx * 50}ms` : '0ms' }}
                    >
                        <span className="action-label">{action.label}</span>
                        <button className={`action-btn ${action.color}`}>
                            <action.icon size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onMouseDown={handleMouseDown}
                className={`main-fab ${isOpen ? 'active' : ''}`}
                title="Quick Actions (Drag to Move)"
            >
                <Plus size={28} className="fab-icon-plus" />
            </button>
        </div>
    );
};

export default SuperQuickActions;
