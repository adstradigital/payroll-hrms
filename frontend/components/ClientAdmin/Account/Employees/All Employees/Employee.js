'use client';

import { useState } from 'react';
import EmployeeList from './EmployeeList/EmployeeList';
import EmployeeForm from './EmployeeForm/EmployeeForm';
import './Employee.css';

export default function Employee() {
    const [view, setView] = useState('list'); // 'list', 'form'
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

    const handleAdd = () => {
        setSelectedEmployeeId(null);
        setView('form');
    };

    const handleEdit = (id) => {
        setSelectedEmployeeId(id);
        setView('form');
    };

    const handleCloseForm = () => {
        setView('list');
        setSelectedEmployeeId(null);
    };

    const handleFormSuccess = () => {
        setView('list');
    };

    return (
        <div className="employee-module">
            {view === 'list' ? (
                <EmployeeList
                    onAdd={handleAdd}
                    onEdit={handleEdit}
                />
            ) : (
                <EmployeeForm
                    employeeId={selectedEmployeeId}
                    onClose={handleCloseForm}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
