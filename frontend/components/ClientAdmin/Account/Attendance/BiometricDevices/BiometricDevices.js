'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, X, Wifi, WifiOff, Clock, CheckCircle2, Circle, Hand, ClipboardList, RefreshCw, AlertCircle } from 'lucide-react';
import './BiometricDevices.css';
import biometricApi from '@/api/biometric_api';

export default function BiometricDevices() {
    const [devices, setDevices] = useState([]);
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
    const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);

    const [newDevice, setNewDevice] = useState({
        name: '',
        device_type: '',
        device_model: '',
        serial_number: '',
        connection_method: 'ip',
        ip_address: '',
        port: '4370',
        api_url: '',
        sync_mode: 'manual',
        device_direction: 'both',
        company: 'Adstradigital',
        activate_live_capture: false
    });

    const [manualEntry, setManualEntry] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        type: 'check_in',
        remarks: ''
    });

    // Fetch devices from backend
    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await biometricApi.getDevices();
            // Handle paginated or non-paginated response gracefully
            const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setDevices(data);
            setFilteredDevices(data);
        } catch (err) {
            console.error('Error fetching biometric devices:', err);
            setError('Failed to load biometric devices. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Search functionality
    useEffect(() => {
        if (!Array.isArray(devices)) return;
        const filtered = devices.filter(device =>
            device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredDevices(filtered);
    }, [searchTerm, devices]);

    const handleAddDevice = async () => {
        try {
            setIsLoading(true);
            const response = await biometricApi.addDevice(newDevice);
            setDevices([...devices, response.data]);
            setIsAddDeviceModalOpen(false);
            setNewDevice({
                name: '',
                device_type: '',
                device_model: '',
                serial_number: '',
                connection_method: 'ip',
                ip_address: '',
                port: '4370',
                api_url: '',
                sync_mode: 'manual',
                device_direction: 'both',
                company: 'Adstradigital',
                activate_live_capture: false
            });
            alert('Device added successfully!');
        } catch (err) {
            console.error('Error adding device:', err);
            alert('Failed to add device. Please check the details and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestConnection = async (deviceId) => {
        try {
            const response = await biometricApi.testConnection(deviceId);
            alert(response.data.message);
            fetchDevices(); // Refresh to show updated status
        } catch (err) {
            console.error('Error testing connection:', err);
            alert('Failed to test connection correctly. Please check device IP and network.');
        }
    };

    const handleSyncLogs = async (deviceId) => {
        try {
            const response = await biometricApi.syncLogs(deviceId);
            alert(response.data.message);
            fetchDevices(); // Refresh to update last sync time and stats
        } catch (err) {
            console.error('Error syncing logs:', err);
            alert('Failed to sync logs from device.');
        }
    };

    const handleManualEntrySubmit = (e) => {
        e.preventDefault();
        // In a real app, this would verify the employee ID and call the backend
        alert(`Manual entry recorded for ${manualEntry.employeeId} at ${manualEntry.time} (${manualEntry.type})`);
        setIsManualEntryModalOpen(false);
        setManualEntry({
            employeeId: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            type: 'check_in',
            remarks: ''
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'live':
            case 'online':
                return <Wifi className="status-icon status-icon--live" size={16} />;
            case 'scheduled':
                return <Clock className="status-icon status-icon--scheduled" size={16} />;
            case 'offline':
            case 'maintenance':
                return <WifiOff className="status-icon status-icon--offline" size={16} />;
            default:
                return <Circle size={16} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'live':
            case 'online':
                return <span className="status-badge status-badge--live">● Online</span>;
            case 'scheduled':
                return <span className="status-badge status-badge--scheduled">● Scheduled</span>;
            case 'maintenance':
                return <span className="status-badge status-badge--scheduled">● Maintenance</span>;
            case 'offline':
                return <span className="status-badge status-badge--offline">● Offline</span>;
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

                    <button className="biodevice-filter-btn" onClick={() => setIsManualEntryModalOpen(true)} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                        <ClipboardList size={18} />
                        <span>Manual Entry</span>
                    </button>

                    <button className="biodevice-add-btn" onClick={() => setIsAddDeviceModalOpen(true)}>
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
                            {Array.isArray(devices) ? devices.filter(d => d.status === 'live' || d.status === 'online').length : 0}
                        </h3>
                        <p className="biodevice-stat-label">Online Devices</p>
                    </div>
                </div>

                <div className="biodevice-stat-card biodevice-stat-card--scheduled">
                    <div className="biodevice-stat-icon">
                        <Clock size={24} />
                    </div>
                    <div className="biodevice-stat-content">
                        <h3 className="biodevice-stat-value">
                            {Array.isArray(devices) ? devices.length : 0}
                        </h3>
                        <p className="biodevice-stat-label">Total Logs</p>
                    </div>
                </div>

                <div className="biodevice-stat-card biodevice-stat-card--offline">
                    <div className="biodevice-stat-icon">
                        <WifiOff size={24} />
                    </div>
                    <div className="biodevice-stat-content">
                        <h3 className="biodevice-stat-value">
                            {Array.isArray(devices) ? devices.filter(d => d.status === 'offline').length : 0}
                        </h3>
                        <p className="biodevice-stat-label">Offline</p>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="biodevice-loading">
                    <RefreshCw className="animate-spin" size={24} />
                    <span>Loading devices...</span>
                </div>
            )}

            {error && (
                <div className="biodevice-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={fetchDevices}>Retry</button>
                </div>
            )}

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
                                    {device.device_direction === 'in' ? 'In Device' :
                                        device.device_direction === 'out' ? 'Out Device' :
                                            'System Direction (In/Out)'}
                                </span>
                            </div>
                            <div className="biodevice-info-row">
                                <span className="biodevice-info-label">Method</span>
                                <span className="biodevice-info-value">
                                    {device.connection_method === 'api' ? 'Cloud API' :
                                        device.connection_method === 'ip' ? 'Local IP' :
                                            device.connection_method === 'excel' ? 'Excel' : 'Manual'}
                                </span>
                            </div>
                            <div className="biodevice-info-row">
                                <span className="biodevice-info-label">Sync</span>
                                <span className="biodevice-info-value">
                                    {device.sync_mode === 'auto' ? 'Automatic' : 'Manual only'}
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
                                <span>{device.total_logs_fetched || 0} Logs</span>
                            </div>
                            <div className="biodevice-live-stat-item">
                                <Clock size={14} className="biodevice-live-stat-icon" />
                                <span>{device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Never'}</span>
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
                            <button
                                className="biodevice-action-btn biodevice-action-btn--test"
                                onClick={() => handleTestConnection(device.id)}
                            >
                                <CheckCircle2 size={16} />
                                Test
                            </button>
                            <button
                                className="biodevice-action-btn biodevice-action-btn--schedule"
                                onClick={() => handleSyncLogs(device.id)}
                            >
                                <RefreshCw size={16} />
                                Sync
                            </button>
                            <button className="biodevice-action-btn biodevice-action-btn--employee">
                                Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Device Modal */}
            {isAddDeviceModalOpen && (
                <div className="biodevice-modal-overlay" onClick={() => setIsAddDeviceModalOpen(false)}>
                    <div className="biodevice-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="biodevice-modal-header">
                            <h2 className="biodevice-modal-title">Add Biometric Device</h2>
                            <button className="biodevice-modal-close" onClick={() => setIsAddDeviceModalOpen(false)}>
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
                                <label className="biodevice-form-label">Serial Number / Machine ID</label>
                                <input
                                    type="text"
                                    placeholder="Enter unique device ID"
                                    className="biodevice-form-input"
                                    value={newDevice.serial_number}
                                    onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
                                />
                            </div>

                            <div className="biodevice-form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="biodevice-form-group">
                                    <label className="biodevice-form-label">Connection Method</label>
                                    <select
                                        className="biodevice-form-select"
                                        value={newDevice.connection_method}
                                        onChange={(e) => setNewDevice({ ...newDevice, connection_method: e.target.value })}
                                    >
                                        <option value="ip">Local Network (IP)</option>
                                        <option value="api">Cloud API</option>
                                        <option value="excel">Excel Upload</option>
                                        <option value="manual">Manual Entry</option>
                                    </select>
                                </div>
                                <div className="biodevice-form-group">
                                    <label className="biodevice-form-label">Sync Mode</label>
                                    <select
                                        className="biodevice-form-select"
                                        value={newDevice.sync_mode}
                                        onChange={(e) => setNewDevice({ ...newDevice, sync_mode: e.target.value })}
                                    >
                                        <option value="manual">Manual Sync Only</option>
                                        <option value="auto">Auto Sync (Daily)</option>
                                    </select>
                                </div>
                            </div>

                            {newDevice.connection_method === 'ip' && (
                                <div className="biodevice-form-group-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                    <div className="biodevice-form-group">
                                        <label className="biodevice-form-label">IP Address</label>
                                        <input
                                            type="text"
                                            placeholder="192.168.1.100"
                                            className="biodevice-form-input"
                                            value={newDevice.ip_address}
                                            onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                                        />
                                    </div>
                                    <div className="biodevice-form-group">
                                        <label className="biodevice-form-label">Port</label>
                                        <input
                                            type="number"
                                            placeholder="4370"
                                            className="biodevice-form-input"
                                            value={newDevice.port}
                                            onChange={(e) => setNewDevice({ ...newDevice, port: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {newDevice.connection_method === 'api' && (
                                <div className="biodevice-form-group">
                                    <label className="biodevice-form-label">API Endpoint URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://api.devicecloud.com/v1/"
                                        className="biodevice-form-input"
                                        value={newDevice.api_url}
                                        onChange={(e) => setNewDevice({ ...newDevice, api_url: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="biodevice-form-group">
                                <label className="biodevice-form-label">Company</label>
                                <select
                                    className="biodevice-form-select"
                                    value={newDevice.company}
                                    onChange={(e) => setNewDevice({ ...newDevice, company: e.target.value })}
                                >
                                    <option value="Adstradigital">Adstradigital</option>
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
                                    <option value="both">System Direction (In/Out)</option>
                                    <option value="in">In Device</option>
                                    <option value="out">Out Device</option>
                                </select>
                            </div>
                        </div>

                        <div className="biodevice-modal-footer">
                            <button className="biodevice-modal-cancel" onClick={() => setIsAddDeviceModalOpen(false)}>
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

            {/* Manual Entry Modal */}
            {isManualEntryModalOpen && (
                <div className="biodevice-modal-overlay" onClick={() => setIsManualEntryModalOpen(false)}>
                    <div className="biodevice-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="biodevice-modal-header">
                            <h2 className="biodevice-modal-title">Manual Biometric Entry</h2>
                            <button className="biodevice-modal-close" onClick={() => setIsManualEntryModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleManualEntrySubmit}>
                            <div className="biodevice-modal-body">
                                <div className="biodevice-form-group">
                                    <label className="biodevice-form-label">Employee ID / Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. EMP001 or John Doe"
                                        className="biodevice-form-input"
                                        required
                                        value={manualEntry.employeeId}
                                        onChange={(e) => setManualEntry({ ...manualEntry, employeeId: e.target.value })}
                                    />
                                </div>

                                <div className="biodevice-form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="biodevice-form-group">
                                        <label className="biodevice-form-label">Date</label>
                                        <input
                                            type="date"
                                            className="biodevice-form-input"
                                            required
                                            value={manualEntry.date}
                                            onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="biodevice-form-group">
                                        <label className="biodevice-form-label">Time</label>
                                        <input
                                            type="time"
                                            className="biodevice-form-input"
                                            required
                                            value={manualEntry.time}
                                            onChange={(e) => setManualEntry({ ...manualEntry, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="biodevice-form-group">
                                    <label className="biodevice-form-label">Entry Type</label>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="entryType"
                                                value="check_in"
                                                checked={manualEntry.type === 'check_in'}
                                                onChange={() => setManualEntry({ ...manualEntry, type: 'check_in' })}
                                            />
                                            Check In
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="entryType"
                                                value="check_out"
                                                checked={manualEntry.type === 'check_out'}
                                                onChange={() => setManualEntry({ ...manualEntry, type: 'check_out' })}
                                            />
                                            Check Out
                                        </label>
                                    </div>
                                </div>

                                <div className="biodevice-form-group">
                                    <label className="biodevice-form-label">Remarks</label>
                                    <textarea
                                        className="biodevice-form-input"
                                        rows="3"
                                        placeholder="Reason for manual entry..."
                                        value={manualEntry.remarks}
                                        onChange={(e) => setManualEntry({ ...manualEntry, remarks: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="biodevice-modal-footer">
                                <button type="button" className="biodevice-modal-cancel" onClick={() => setIsManualEntryModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="biodevice-modal-save">
                                    <CheckCircle2 size={18} />
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
