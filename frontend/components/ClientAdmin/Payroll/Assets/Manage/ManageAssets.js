'use client';

import { useState } from 'react';
import {
    Plus, Search, Filter, Edit2, Trash2,
    MoreHorizontal, Download, Upload,
    ChevronLeft, ChevronRight, Laptop,
    Smartphone, Monitor, HardDrive, Box
} from 'lucide-react';
import './ManageAssets.css';

const initialAssets = [
    { id: 'AST001', name: 'MacBook Pro M2', category: 'Laptop', model: 'Apple M2 2023', serial: 'SN-482930', status: 'allocated', user: 'Anil Kumar' },
    { id: 'AST002', name: 'Dell UltraSharp', category: 'Monitor', model: 'U2723QE', serial: 'SN-293041', status: 'available', user: '-' },
    { id: 'AST003', name: 'iPhone 14 Pro', category: 'Mobile', model: '256GB Space Black', serial: 'SN-102938', status: 'in-repair', user: 'Sneha Rao' },
    { id: 'AST004', name: 'Logitech MX Master 3', category: 'Peripherals', model: 'Graphite', serial: 'SN-556677', status: 'allocated', user: 'Rahul Singh' },
    { id: 'AST005', name: 'ThinkPad X1 Carbon', category: 'Laptop', model: 'Gen 11', serial: 'SN-998877', status: 'allocated', user: 'Priya Verma' },
    { id: 'AST006', name: 'AirPods Pro', category: 'Audio', model: 'Gen 2', serial: 'SN-332211', status: 'available', user: '-' },
    { id: 'AST007', name: 'Ipad Pro 12.9', category: 'Tablet', model: 'M2 512GB', serial: 'SN-445566', status: 'lost', user: '-' },
    { id: 'AST008', name: 'HP LaserJet Pro', category: 'Printer', model: 'M404dn', serial: 'SN-778899', status: 'allocated', user: 'IT Support' },
];

export default function ManageAssets() {
    const [assets, setAssets] = useState(initialAssets);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const getIcon = (category) => {
        switch (category.toLowerCase()) {
            case 'laptop': return <Laptop size={18} />;
            case 'mobile': return <Smartphone size={18} />;
            case 'monitor': return <Monitor size={18} />;
            case 'peripherals': return <Box size={18} />;
            default: return <HardDrive size={18} />;
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.user.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="manage-assets">
            {/* Toolbar */}
            <div className="ma-toolbar">
                <div className="ma-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, ID or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ma-actions">
                    <div className="ma-filter-group">
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="allocated">Allocated</option>
                            <option value="available">Available</option>
                            <option value="in-repair">In Repair</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>
                    <button className="ma-btn ma-btn--outline">
                        <Upload size={18} /> Import
                    </button>
                    <button className="ma-btn ma-btn--outline">
                        <Download size={18} /> Export
                    </button>
                    <button className="ma-btn ma-btn--primary">
                        <Plus size={18} /> Add Asset
                    </button>
                </div>
            </div>

            {/* Assets Table */}
            <div className="ma-table-container">
                <table className="ma-table">
                    <thead>
                        <tr>
                            <th>Asset ID</th>
                            <th>Asset Name</th>
                            <th>Category</th>
                            <th>Model/Serial</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.map((asset) => (
                            <tr key={asset.id}>
                                <td className="ma-td-id">{asset.id}</td>
                                <td className="ma-td-name">
                                    <div className="ma-name-wrapper">
                                        <div className="ma-category-icon">{getIcon(asset.category)}</div>
                                        <span>{asset.name}</span>
                                    </div>
                                </td>
                                <td>{asset.category}</td>
                                <td className="ma-td-model">
                                    <div className="ma-model">{asset.model}</div>
                                    <div className="ma-serial">{asset.serial}</div>
                                </td>
                                <td>
                                    <span className={`ma-status-label ma-status-label--${asset.status}`}>
                                        {asset.status.replace('-', ' ')}
                                    </span>
                                </td>
                                <td className="ma-td-user">{asset.user}</td>
                                <td className="ma-td-actions">
                                    <div className="ma-action-row">
                                        <button className="ma-action-icon" title="Edit"><Edit2 size={16} /></button>
                                        <button className="ma-action-icon ma-action-icon--danger" title="Delete"><Trash2 size={16} /></button>
                                        <button className="ma-action-icon"><MoreHorizontal size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="ma-pagination">
                <p>Showing <strong>{filteredAssets.length}</strong> of <strong>{assets.length}</strong> assets</p>
                <div className="ma-page-controls">
                    <button className="ma-page-btn" disabled><ChevronLeft size={18} /></button>
                    <button className="ma-page-btn ma-page-btn--active">1</button>
                    <button className="ma-page-btn">2</button>
                    <button className="ma-page-btn">3</button>
                    <button className="ma-page-btn"><ChevronRight size={18} /></button>
                </div>
            </div>
        </div>
    );
}
