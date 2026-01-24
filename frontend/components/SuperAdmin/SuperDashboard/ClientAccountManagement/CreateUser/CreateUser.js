import React from 'react';
import {
    Users,
    UserPlus,
    Shield,
    Mail,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import './CreateUser.css';

const CreateUser = () => {
    return (
        <div className="create-user-wrapper animate-slide-up">
            <div className="page-header-flex">
                <div>
                    <h1 className="page-heading">Create New User</h1>
                    <p className="page-subheading">Add a new user to the system and assign them to an organization with specific roles.</p>
                </div>
            </div>

            <div className="create-user-form-container">
                <div className="form-card-premium">
                    <div className="form-section">
                        <h3 className="section-title">Account Information</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" placeholder="john@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Organization</label>
                                <select>
                                    <option>Select Organization</option>
                                    <option>Acme Corp</option>
                                    <option>Cyberdyne Systems</option>
                                    <option>Initech</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select>
                                    <option>Select Role</option>
                                    <option>Client Admin</option>
                                    <option>HR Manager</option>
                                    <option>Employee</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section pt-6 mt-6 border-t border-zinc-800">
                        <h3 className="section-title">Security & Permissions</h3>
                        <div className="checkbox-group">
                            <label className="checkbox-item">
                                <input type="checkbox" />
                                <span>Require Password Reset on First Login</span>
                            </label>
                            <label className="checkbox-item">
                                <input type="checkbox" />
                                <span>Enable Multi-Factor Authentication</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-footer mt-8">
                        <button className="btn-save-user">
                            <UserPlus size={18} />
                            <span>Provision User</span>
                        </button>
                    </div>
                </div>

                <div className="form-info-sidebar">
                    <div className="info-card-glass">
                        <div className="info-icon-wrapper">
                            <Shield size={24} className="text-amber-500" />
                        </div>
                        <h4>Role Access</h4>
                        <p>Roles determine what features and data a user can access. Be sure to select the most restrictive role necessary for their job function.</p>
                    </div>
                    <div className="info-card-glass">
                        <div className="info-icon-wrapper">
                            <Mail size={24} className="text-blue-500" />
                        </div>
                        <h4>Welcome Email</h4>
                        <p>The user will receive an automated invitation email with their login credentials and setup instructions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUser;
