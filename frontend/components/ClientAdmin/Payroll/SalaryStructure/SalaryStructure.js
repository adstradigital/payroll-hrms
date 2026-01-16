'use client';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2, DollarSign, Percent } from 'lucide-react';
import './SalaryStructure.css';

// Mock data
const mockStructures = [
    { id: 1, name: 'Executive Grade', code: 'EXE', employees: 25, basicRange: '15,000 - 25,000', isActive: true },
    { id: 2, name: 'Manager Grade', code: 'MGR', employees: 12, basicRange: '30,000 - 50,000', isActive: true },
    { id: 3, name: 'Senior Manager', code: 'SMG', employees: 5, basicRange: '60,000 - 80,000', isActive: true },
    { id: 4, name: 'Director Grade', code: 'DIR', employees: 3, basicRange: '100,000 - 150,000', isActive: true },
];

const mockComponents = [
    { id: 1, name: 'Basic Salary', code: 'BASIC', type: 'earning', calculation: 'fixed', taxable: true },
    { id: 2, name: 'HRA', code: 'HRA', type: 'earning', calculation: '40% of Basic', taxable: true },
    { id: 3, name: 'Conveyance', code: 'CONV', type: 'earning', calculation: 'fixed', taxable: false },
    { id: 4, name: 'Medical Allowance', code: 'MED', type: 'earning', calculation: 'fixed', taxable: false },
    { id: 5, name: 'PF (Employee)', code: 'PF', type: 'deduction', calculation: '12% of Basic', taxable: false },
    { id: 6, name: 'ESI (Employee)', code: 'ESI', type: 'deduction', calculation: '0.75% of Gross', taxable: false },
    { id: 7, name: 'Professional Tax', code: 'PT', type: 'deduction', calculation: 'fixed', taxable: false },
];

export default function SalaryStructure() {
    const [activeTab, setActiveTab] = useState('structures');
    const [structures, setStructures] = useState(mockStructures);
    const [components, setComponents] = useState(mockComponents);

    return (
        <div className="salary-structure">
            {/* Tabs */}
            <div className="salary-tabs">
                <button
                    className={`salary-tab ${activeTab === 'structures' ? 'salary-tab--active' : ''}`}
                    onClick={() => setActiveTab('structures')}
                >
                    Salary Structures
                </button>
                <button
                    className={`salary-tab ${activeTab === 'components' ? 'salary-tab--active' : ''}`}
                    onClick={() => setActiveTab('components')}
                >
                    Salary Components
                </button>
            </div>

            {/* Structures Tab */}
            {activeTab === 'structures' && (
                <div className="salary-content">
                    <div className="salary-toolbar">
                        <div className="salary-search">
                            <Search size={18} className="salary-search__icon" />
                            <input
                                type="text"
                                placeholder="Search structures..."
                                className="salary-search__input"
                            />
                        </div>
                        <button className="btn btn-primary">
                            <Plus size={18} />
                            Add Structure
                        </button>
                    </div>

                    <div className="structure-grid">
                        {structures.map(structure => (
                            <div key={structure.id} className="structure-card">
                                <div className="structure-card__header">
                                    <span className="structure-card__code">{structure.code}</span>
                                    <span className={`badge ${structure.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                        {structure.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <h3 className="structure-card__name">{structure.name}</h3>
                                <div className="structure-card__stats">
                                    <div className="structure-stat">
                                        <span className="structure-stat__value">{structure.employees}</span>
                                        <span className="structure-stat__label">Employees</span>
                                    </div>
                                    <div className="structure-stat">
                                        <span className="structure-stat__value">₹{structure.basicRange}</span>
                                        <span className="structure-stat__label">Basic Range</span>
                                    </div>
                                </div>
                                <div className="structure-card__actions">
                                    <button className="action-btn"><Edit size={16} /> Edit</button>
                                    <button className="action-btn action-btn--danger"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Components Tab */}
            {activeTab === 'components' && (
                <div className="salary-content">
                    <div className="salary-toolbar">
                        <div className="salary-search">
                            <Search size={18} className="salary-search__icon" />
                            <input
                                type="text"
                                placeholder="Search components..."
                                className="salary-search__input"
                            />
                        </div>
                        <button className="btn btn-primary">
                            <Plus size={18} />
                            Add Component
                        </button>
                    </div>

                    <div className="component-table-container">
                        <table className="component-table">
                            <thead>
                                <tr>
                                    <th>Component</th>
                                    <th>Code</th>
                                    <th>Type</th>
                                    <th>Calculation</th>
                                    <th>Taxable</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {components.map(comp => (
                                    <tr key={comp.id}>
                                        <td>
                                            <div className="component-name">
                                                {comp.type === 'earning' ?
                                                    <DollarSign size={16} className="icon-earning" /> :
                                                    <Percent size={16} className="icon-deduction" />
                                                }
                                                {comp.name}
                                            </div>
                                        </td>
                                        <td><code>{comp.code}</code></td>
                                        <td>
                                            <span className={`badge ${comp.type === 'earning' ? 'badge-success' : 'badge-danger'}`}>
                                                {comp.type}
                                            </span>
                                        </td>
                                        <td>{comp.calculation}</td>
                                        <td>
                                            {comp.taxable ?
                                                <span className="badge badge-warning">Yes</span> :
                                                <span className="badge badge-secondary">No</span>
                                            }
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn"><Edit size={16} /></button>
                                                <button className="action-btn action-btn--danger"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
