'use client';

import { useState } from 'react';
import { Search, Plus, BookOpen, Clock, Users, Play, Award } from 'lucide-react';
import './Courses.css';

const mockCourses = [
    { id: 1, title: 'React Advanced Patterns', category: 'Development', duration: '8 hours', enrolled: 25, completion: 65, status: 'active' },
    { id: 2, title: 'Leadership Skills', category: 'Management', duration: '4 hours', enrolled: 15, completion: 80, status: 'active' },
    { id: 3, title: 'Data Privacy & Security', category: 'Compliance', duration: '2 hours', enrolled: 50, completion: 90, status: 'mandatory' },
    { id: 4, title: 'Effective Communication', category: 'Soft Skills', duration: '3 hours', enrolled: 30, completion: 45, status: 'active' },
];

export default function Courses() {
    const [courses, setCourses] = useState(mockCourses);
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="courses">
            <div className="courses-toolbar">
                <div className="courses-search">
                    <Search size={18} className="courses-search__icon" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="courses-search__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary">
                    <Plus size={18} />
                    Add Course
                </button>
            </div>

            <div className="courses-grid">
                {courses.map(course => (
                    <div key={course.id} className="course-card">
                        <div className="course-card__header">
                            <div className="course-card__icon">
                                <BookOpen size={20} />
                            </div>
                            <span className={`badge ${course.status === 'mandatory' ? 'badge-danger' : 'badge-success'}`}>
                                {course.status === 'mandatory' ? 'Mandatory' : 'Optional'}
                            </span>
                        </div>

                        <h3 className="course-card__title">{course.title}</h3>
                        <span className="course-card__category">{course.category}</span>

                        <div className="course-card__stats">
                            <div className="course-stat">
                                <Clock size={14} />
                                <span>{course.duration}</span>
                            </div>
                            <div className="course-stat">
                                <Users size={14} />
                                <span>{course.enrolled} enrolled</span>
                            </div>
                        </div>

                        <div className="course-card__progress">
                            <span className="progress-label">Avg. Completion</span>
                            <div className="progress-bar">
                                <div className="progress-bar__fill" style={{ width: `${course.completion}%` }}></div>
                            </div>
                            <span className="progress-text">{course.completion}%</span>
                        </div>

                        <button className="course-card__btn">
                            <Play size={14} />
                            View Course
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
