'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Download,
  Edit,
  CheckCircle,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  User,
  Building,
  Loader
} from 'lucide-react';
import {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  bulkMarkAttendance,
  getAllEmployees
} from '@/api/api_clientadmin';
import './AttendanceRegister.css';

export default function AttendanceRegister() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    check_in_time: '09:00',
    check_out_time: '18:00',
    status: 'present',
    source: 'manual'
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        date: dateFilter,
        search: search || undefined
      };

      const attendanceRes = await getAllAttendance(params);
      setData(attendanceRes.data.results || attendanceRes.data);

      // Only fetch employees once or if needed
      if (employees.length === 0) {
        const employeesRes = await getAllEmployees();
        setEmployees(employeesRes.data.results || employeesRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelect = (id) => {
    setSelected(
      selected.includes(id)
        ? selected.filter(i => i !== id)
        : [...selected, id]
    );
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(filteredData.map(item => item.id));
    } else {
      setSelected([]);
    }
  };

  const filteredData = data.filter(item => {
    return (
      (department === 'all' || item.employee_department === department) &&
      (statusFilter === 'all' || item.status === statusFilter)
    );
  });

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      employee: '',
      date: dateFilter,
      check_in_time: '09:00',
      check_out_time: '18:00',
      status: 'present',
      source: 'manual'
    });
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setModalMode('edit');
    setEditingId(record.id);
    setFormData({
      employee: record.employee,
      date: record.date,
      check_in_time: record.check_in_time ? record.check_in_time.substring(11, 16) : '',
      check_out_time: record.check_out_time ? record.check_out_time.substring(11, 16) : '',
      status: record.status,
      source: 'manual'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format timestamps
      const dateStr = formData.date;
      const checkInFull = formData.check_in_time ? `${dateStr}T${formData.check_in_time}:00` : null;
      const checkOutFull = formData.check_out_time ? `${dateStr}T${formData.check_out_time}:00` : null;

      const payload = {
        employee: formData.employee,
        date: formData.date,
        check_in_time: checkInFull,
        check_out_time: checkOutFull,
        status: formData.status,
        remarks: 'Manual Entry'
      };

      if (modalMode === 'add') {
        await createAttendance(payload);
      } else {
        await updateAttendance(editingId, payload);
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving attendance:', error);
      let errorMessage = 'Failed to save attendance record.';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'object' && error.response.data !== null) {
          errorMessage = Object.entries(error.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
        } else {
          errorMessage = String(error.response.data);
        }
      }
      alert(errorMessage);
    }
  };

  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    try {
      // Backend expects 'employees' list of IDs
      const selectedRecords = data.filter(d => selected.includes(d.id));
      const employeeIds = selectedRecords.map(r => r.employee);

      // Or does backend expect attendance IDs? 
      // The 'bulk_mark' endpoint in views.py takes `employees` (employee IDs) and marks attendance for a specific date.
      // It doesn't seem to support updating existing attendance status by Attendance ID directly for approval.
      // For "Approval", we might just be setting a status or remarks.
      // If we want to "Approve" (e.g. validat), we might use 'to-validate' endpoint or just update status.
      // For now, let's assume 'Approve' means marking as 'present' and validated.

      // If the intention is to VALIDATE existing records:
      // The backend has `to_validate` POST endpoint taking `attendance_id`.
      // We would need to loop efficiently or add a bulk validate endpoint.

      // Let's implement bulk mark as 'present' for now using the bulk endpoint for Employee IDs.

      await bulkMarkAttendance({
        employees: employeeIds,
        status: 'present',
        date: dateFilter
      });

      fetchData();
      setSelected([]);
    } catch (error) {
      console.error('Bulk approve error:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Employee', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'],
      ...filteredData.map(row => [
        row.employee_name || 'N/A',
        row.employee_department || 'N/A',
        row.date,
        row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString() : 'N/A',
        row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString() : 'N/A',
        row.total_hours,
        row.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${dateFilter}.csv`;
    a.click();
  };

  return (
    <div className="attendance-register">
      {/* Header */}
      <div className="attendance-header">
        <div>
          <h1>Attendance Register</h1>
          <p className="subtitle">{filteredData.length} records found</p>
        </div>
        <div className="date-filter">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="attendance-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select onChange={e => setDepartment(e.target.value)} value={department}>
              <option value="all">All Departments</option>
              {/* Populate dynamically if available */}
              <option value="HR">HR</option>
              <option value="IT">IT</option>
            </select>

            <select onChange={e => setStatusFilter(e.target.value)} value={statusFilter}>
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <button className="btn secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn primary" onClick={openAddModal}>
            <Plus size={16} /> Mark Attendance
          </button>
        </div>
      </div>

      {/* Bulk Action */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span className="selected-count">{selected.length} selected</span>
          <button className="bulk-btn approve" onClick={handleBulkApprove}>
            Mark Present
          </button>
          <button className="bulk-btn danger" onClick={() => setSelected([])}>
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="loading-state">
            <Loader className="animate-spin" size={24} />
            <span>Loading records...</span>
          </div>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={selected.length === filteredData.length && filteredData.length > 0}
                  />
                </th>
                <th>Employee</th>
                <th>Date</th>
                <th>In / Out</th>
                <th>Hours</th>
                <th>Device</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map(row => (
                <tr key={row.id} className={selected.includes(row.id) ? 'selected-row' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onChange={() => toggleSelect(row.id)}
                    />
                  </td>

                  <td>
                    <div className="employee-cell">
                      <div className="avatar">{(row.employee_name || 'U').charAt(0)}</div>
                      <div>
                        <strong>{row.employee_name}</strong>
                        <div className="muted">{row.employee_id}</div>
                      </div>
                    </div>
                  </td>

                  <td>{row.date}</td>

                  <td>
                    <div className="time-cell">
                      <div className={`time-in ${!row.check_in_time ? 'missing' : ''}`}>
                        <Clock size={12} /> {row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </div>
                      <div className={`time-out ${!row.check_out_time ? 'missing' : ''}`}>
                        <Clock size={12} /> {row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="hours">
                      {row.total_hours} hrs
                    </div>
                  </td>

                  <td>
                    <span className="source system">
                      {row.check_in_device || 'System'}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${row.status}`}>
                      {row.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(row)}
                      title="Edit record"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No attendance records found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Mark Attendance' : 'Edit Attendance'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>
                  <User size={14} /> Employee
                </label>
                <select
                  required
                  value={formData.employee}
                  onChange={e => setFormData({ ...formData, employee: e.target.value })}
                  disabled={modalMode === 'edit'}
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={14} /> Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="time-inputs">
                <div className="form-group">
                  <label>Check In</label>
                  <input
                    type="time"
                    value={formData.check_in_time}
                    onChange={e => setFormData({ ...formData, check_in_time: e.target.value })}
                    disabled={formData.status === 'absent'}
                  />
                </div>

                <div className="form-group">
                  <label>Check Out</label>
                  <input
                    type="time"
                    value={formData.check_out_time}
                    onChange={e => setFormData({ ...formData, check_out_time: e.target.value })}
                    disabled={formData.status === 'absent'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <div className="status-options">
                  {['present', 'late', 'absent'].map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`status-option ${formData.status === s ? 'active' : ''} ${s}`}
                      onClick={() => setFormData({ ...formData, status: s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  {modalMode === 'add' ? 'Save Record' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}