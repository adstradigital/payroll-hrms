'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, X, Wifi, WifiOff, Clock, CheckCircle2, Circle } from 'lucide-react';
import './BiometricDevices.css';

export default function BiometricDevices() {
    const [devices, setDevices] = useState([]);
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDevice, setNewDevice] = useState({
        name: '',
        device_type: '',
        device_direction: 'System Direction(In/Out) Device',
        company: 'Mine',
        ip_address: '',
        port: '',
        activate_live_capture: false
    });

    // Mock data
    useEffect(() => {
        const mockDevices = [
            {
                id: 1,
                name: 'In Device',
                company: 'ZKTeco / eSSL Biometric',
                device_direction: 'System Direction(In/Out) Device',
                ip_address: '192.168.1.10',
                port: '4370',
                activate_live_capture: true,
                status: 'live',
                lastSync: '2 mins ago',
                activeUsers: 45
            },
            {
                id: 2,
                name: 'Eng Renad',
                company: 'e-Time Office',
                device_direction: 'In Device',
                ip_address: 'https://api.etimeoffice.com/api/',
                port: '',
                activate_live_capture: false,
                status: 'scheduled',
                lastSync: '15 mins ago',
                activeUsers: 23
            },
            {
                id: 3,
                name: 'Zkteco 400',
                company: 'ZKTeco / eSSL Biometric',
                device_direction: 'System Direction(In/Out) Device',
                ip_address: '192.168.1.50',
                port: '1',
                activate_live_capture: false,
                status: 'offline',
                lastSync: '2 hours ago',
                activeUsers: 0
            }
        ];
        setDevices(mockDevices);
        setFilteredDevices(mockDevices);
    }, []);

    // Search functionality
    useEffect(() => {
        const filtered = devices.filter(device =>
            device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.ip_address.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredDevices(filtered);
    }, [searchTerm, devices]);

    const handleAddDevice = () => {
        const deviceToAdd = {
            ...newDevice,
            id: devices.length + 1,
            status: 'offline',
            lastSync: 'Never',
            activeUsers: 0
        };
        setDevices([...devices, deviceToAdd]);
        setIsModalOpen(false);
        setNewDevice({
            name: '',
            device_type: '',
            device_direction: 'System Direction(In/Out) Device',
            company: 'Mine',
            ip_address: '',
            port: '',
            activate_live_capture: false
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'live':
                return <Wifi className="status-icon status-icon--live" size={16} />;
            case 'scheduled':
                return <Clock className="status-icon status-icon--scheduled" size={16} />;
            case 'offline':
                return <WifiOff className="status-icon status-icon--offline" size={16} />;
            default:
                return <Circle size={16} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'live':
                return <span className="status-badge status-badge--live">● Live Capture</span>;
            case 'scheduled':
                return <span className="status-badge status-badge--scheduled">● Scheduled</span>;
            case 'offline':
                return <span className="status-badge status-badge--offline">● Not Connected</span>;
            default:
                return null;
        }
    };

    return (
        <div className="biometric-devices-modern">
            {/* Header Section */}
            <div className="biodevice-header">
                <div className="biodevice-header-left">
                    <h1 className="biodevice-main-title">Biometric Devices</h1>
                    <p className="biodevice-subtitle">{filteredDevices.length} devices registered</p>
                </div>

                <div className="biodevice-header-right">
                    <div className="biodevice-search-wrapper">
                        <Search size={18} className="biodevice-search-icon" />
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="biodevice-search-input"
                        />
                    </div>

                    <button className="biodevice-filter-btn">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>

                    <button className="biodevice-add-btn" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        <span>Add Device</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="biodevice-stats-grid">
                <div className="biodevice-stat-card biodevice-stat-card--live">
                    <div className="biodevice-stat-icon">
                        <Wifi size={24} />
                    </div>
                    <div className="biodevice-stat-content">
                        <h3 className="biodevice-stat-value">
                            {devices.filter(d => d.status === 'live').length}
                        </h3>
                        <p className="biodevice-stat-label">Live Capture</p>
                    </div>
                </div>

                <div className="biodevice-stat-card biodevice-stat-card--scheduled">
                    <div className="biodevice-stat-icon">
                        <Clock size={24} />
                    </div>
                    <div className="biodevice-stat-content">
                        <h3 className="biodevice-stat-value">
                            {devices.filter(d => d.status === 'scheduled').length}
                        </h3>
                        <p className="biodevice-stat-label">Scheduled</p>
                    </div>
                </div>

                <div className="biodevice-stat-card biodevice-stat-card--offline">
                    <div className="biodevice-stat-icon">
                        <WifiOff size={24} />
                    </div>
                    <div className="biodevice-stat-content">
                        <h3 className="biodevice-stat-value">
                            {devices.filter(d => d.status === 'offline').length}
                        </h3>
                        <p className="biodevice-stat-label">Offline</p>
                    </div>
                </div>
            </div>

            {/* Device Cards Grid */}
            <div className="biodevice-cards-grid">
                {filteredDevices.map((device) => (
                    <div key={device.id} className={`biodevice-card biodevice-card--${device.status}`}>
                        {/* Card Header */}
                        <div className="biodevice-card-header">
                            <div className="biodevice-card-title-section">
                                {getStatusIcon(device.status)}
                                <h3 className="biodevice-card-title">{device.name}</h3>
                            </div>
                            <div className="biodevice-card-actions-top">
                                {getStatusBadge(device.status)}
                                <button className="biodevice-menu-btn">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Device Information */}
                        <div className="biodevice-info-section">
                            <div className="biodevice-info-row">
                                <span className="biodevice-info-label">Type</span>
                                <span className="biodevice-info-value">{device.company}</span>
                            </div>
                            <div className="biodevice-info-row">
                                <span className="biodevice-info-label">Direction</span>
                                <span className="biodevice-info-value biodevice-info-value--small">
                                    {device.device_direction}
                                </span>
                            </div>
                            <div className="biodevice-info-row">
                                <span className="biodevice-info-label">Address</span>
                                <span className="biodevice-info-value biodevice-info-value--mono">
                                    {device.ip_address}
                                </span>
                            </div>
                            {device.port && (
                                <div className="biodevice-info-row">
                                    <span className="biodevice-info-label">Port</span>
                                    <span className="biodevice-info-value biodevice-info-value--mono">
                                        {device.port}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Live Stats */}
                        <div className="biodevice-live-stats">
                            <div className="biodevice-live-stat-item">
                                <CheckCircle2 size={14} className="biodevice-live-stat-icon" />
                                <span>{device.activeUsers} Active</span>
                            </div>
                            <div className="biodevice-live-stat-item">
                                <Clock size={14} className="biodevice-live-stat-icon" />
                                <span>{device.lastSync}</span>
                            </div>
                        </div>

                        {/* Live Capture Toggle */}
                        <div className="biodevice-toggle-section">
                            <span className="biodevice-toggle-label">Live Capture Mode</span>
                            <label className="biodevice-toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={device.activate_live_capture}
                                    onChange={() => { }}
                                />
                                <span className="biodevice-toggle-slider"></span>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="biodevice-card-actions">
                            <button className="biodevice-action-btn biodevice-action-btn--test">
                                <CheckCircle2 size={16} />
                                Test
                            </button>
                            <button className="biodevice-action-btn biodevice-action-btn--schedule">
                                <Clock size={16} />
                                Schedule
                            </button>
                            <button className="biodevice-action-btn biodevice-action-btn--employee">
                                Employee
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Device Modal */}
            {isModalOpen && (
                <div className="biodevice-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="biodevice-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="biodevice-modal-header">
                            <h2 className="biodevice-modal-title">Add Biometric Device</h2>
                            <button className="biodevice-modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="biodevice-modal-body">
                            <div className="biodevice-form-group">
                                <label className="biodevice-form-label">Device Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter device name"
                                    className="biodevice-form-input"
                                    value={newDevice.name}
                                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                                />
                            </div>

                            <div className="biodevice-form-group">
                                <label className="biodevice-form-label">Device Type</label>
                                <select
                                    className="biodevice-form-select"
                                    value={newDevice.device_type}
                                    onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                                >
                                    <option value="">Select device type</option>
                                    <option value="ZKTeco / eSSL Biometric">ZKTeco / eSSL Biometric</option>
                                    <option value="e-Time Office">e-Time Office</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="biodevice-form-group">
                                <label className="biodevice-form-label">Device Direction</label>
                                <select
                                    className="biodevice-form-select"
                                    value={newDevice.device_direction}
                                    onChange={(e) => setNewDevice({ ...newDevice, device_direction: e.target.value })}
                                >
                                    <option value="System Direction(In/Out) Device">System Direction (In/Out)</option>
                                    <option value="In Device">In Device</option>
                                    <option value="Out Device">Out Device</option>
                                </select>
                            </div>

                            <div className="biodevice-form-group">
                                <label className="biodevice-form-label">Company</label>
                                <select
                                    className="biodevice-form-select"
                                    value={newDevice.company}
                                    onChange={(e) => setNewDevice({ ...newDevice, company: e.target.value })}
                                >
                                    <option value="Mine">Mine</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="biodevice-modal-footer">
                            <button className="biodevice-modal-cancel" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="biodevice-modal-save" onClick={handleAddDevice}>
                                <Plus size={18} />
                                Add Device
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
