'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeList from './EmployeeList/EmployeeList';
import EmployeeForm from './EmployeeForm/EmployeeForm';
import './Employee.css';

export default function Employee() {
    const router = useRouter();
    const [view, setView] = useState('list'); // 'list', 'form'
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [refreshList, setRefreshList] = useState(0);

    const handleAdd = () => {
        setSelectedEmployeeId(null);
        setView('form');
    };

    const handleEdit = (id) => {
        setSelectedEmployeeId(id);
        setView('form');
    };

    const handleViewProfile = (id) => {
        router.push(`/dashboard/employees/${id}`);
    };

    const handleClose = () => {
        setView('list');
        setSelectedEmployeeId(null);
    };

    const handleFormSuccess = () => {
        setView('list');
        setRefreshList(prev => prev + 1);
    };

    return (
        <div className="employee-module">
            <EmployeeList
                onAdd={handleAdd}
                onEdit={handleEdit}
                onView={handleViewProfile}
                refreshTrigger={refreshList}
            />

            {view === 'form' && (
                <EmployeeForm
                    employeeId={selectedEmployeeId}
                    onClose={handleClose}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
