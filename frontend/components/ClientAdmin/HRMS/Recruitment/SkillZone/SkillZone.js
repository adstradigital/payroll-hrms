'use client';

import React from 'react';
import { Code, PenTool, Users, Plus, MoreHorizontal } from 'lucide-react';
import './SkillZone.css';

export default function SkillZone() {
    const skillCategories = [
        {
            title: 'Development',
            icon: <Code size={20} />,
            color: 'blue',
            skills: [
                { name: 'React.js', level: 'Expert', candidates: 45 },
                { name: 'Python/Django', level: 'Advanced', candidates: 32 },
                { name: 'Node.js', level: 'Intermediate', candidates: 18 },
                { name: 'PostgreSQL', level: 'Advanced', candidates: 28 },
            ]
        },
        {
            title: 'Design',
            icon: <PenTool size={20} />,
            color: 'purple',
            skills: [
                { name: 'Figma', level: 'Expert', candidates: 22 },
                { name: 'Adobe XD', level: 'Intermediate', candidates: 15 },
                { name: 'UI Prototyping', level: 'Advanced', candidates: 20 },
            ]
        },
        {
            title: 'Soft Skills',
            icon: <Users size={20} />,
            color: 'green',
            skills: [
                { name: 'Leadership', level: 'N/A', candidates: 50 },
                { name: 'Communication', level: 'N/A', candidates: 120 },
                { name: 'Team Player', level: 'N/A', candidates: 95 },
            ]
        }
    ];

    return (
        <div className="skill-zone-container">
            <div className="skill-header">
                <div>
                    <h2>Skill Zone</h2>
                    <p>Manage competencies and skills for job roles.</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={16} /> Add New Skill
                </button>
            </div>

            <div className="skill-categories-grid">
                {skillCategories.map((category, index) => (
                    <div key={index} className="category-column">
                        <div className={`category-header ${category.color}`}>
                            <div className="icon-box">
                                {category.icon}
                            </div>
                            <h3>{category.title}</h3>
                            <span className="count-badge">{category.skills.length}</span>
                        </div>
                        <div className="skills-list">
                            {category.skills.map((skill, idx) => (
                                <div key={idx} className="skill-card">
                                    <div className="skill-info">
                                        <h4>{skill.name}</h4>
                                        <div className="skill-meta">
                                            {skill.level !== 'N/A' && <span className="level-tag">{skill.level}</span>}
                                            <span className="candidate-count">{skill.candidates} Candidates</span>
                                        </div>
                                    </div>
                                    <button className="more-btn">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            ))}
                            <button className="add-card-btn">
                                <Plus size={14} /> Add to {category.title}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
