# Frontend Development Guidelines

## Project Structure

```
frontend/
├── app/                              # ROUTING ONLY
│   ├── layout.js
│   ├── page.js
│   ├── login/page.js
│   ├── register/page.js
│   └── dashboard/
│       ├── page.js
│       ├── employees/page.js
│       ├── attendance/page.js
│       ├── leave/page.js
│       └── payroll/page.js
│
├── components/
│   └── ClientAdmin/                  # CLIENT ADMIN PORTAL
│       │
│       ├── Account/                  # COMMON (Auth + Employees)
│       │   ├── Login/
│       │   │   ├── Login.js
│       │   │   └── Login.css
│       │   ├── Register/
│       │   │   ├── Register.js
│       │   │   └── Register.css
│       │   └── Employee/             # Employee management (SHARED)
│       │       ├── EmployeeList/
│       │       ├── EmployeeForm/
│       │       └── EmployeeCard/
│       │
│       ├── Dashboard/                # DASHBOARD LAYOUT
│       │   ├── Dashboard.js
│       │   ├── Dashboard.css
│       │   ├── Sidebar/
│       │   ├── Header/
│       │   └── ThemeToggle/
│       │
│       ├── HRMS/                     # HRMS MODULE (Self-contained)
│       │   ├── Attendance/
│       │   │   └── AttendanceList/
│       │   ├── Leave/
│       │   │   ├── LeaveList/
│       │   │   ├── LeaveForm/
│       │   │   └── LeaveBalance/
│       │   ├── Recruitment/
│       │   │   ├── JobOpenings/
│       │   │   ├── Candidates/
│       │   │   └── Pipeline/
│       │   ├── Performance/
│       │   │   ├── Reviews/
│       │   │   └── Goals/
│       │   └── Training/
│       │       ├── Courses/
│       │       └── Certifications/
│       │
│       └── Payroll/                  # PAYROLL MODULE (Self-contained)
│           ├── Attendance/           # For salary calculation
│           │   └── AttendanceList/
│           ├── Leave/                # For deductions
│           │   └── LeaveDeductions/
│           ├── SalaryStructure/
│           │   ├── SalaryStructure.js
│           │   └── SalaryStructure.css
│           ├── PaySlips/
│           │   └── PaySlipList/
│           ├── RunPayroll/
│           │   ├── RunPayroll.js
│           │   └── RunPayroll.css
│           └── Reports/
│               ├── PayrollReport/
│               └── TaxReport/
│
├── context/
│   └── ThemeContext.js
│
├── styles/
│   ├── globals.css
│   └── theme.css
│
└── lib/
    └── api.js
```

---

## Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ClientAdmin                            │
├─────────────────────────────────────────────────────────────┤
│  Account/                │  Dashboard/                      │
│  ├── Login               │  ├── Sidebar                     │
│  ├── Register            │  ├── Header                      │
│  └── Employee (SHARED)   │  └── ThemeToggle                 │
├─────────────────────────────────────────────────────────────┤
│  HRMS/                   │  Payroll/                        │
│  ├── Attendance          │  ├── Attendance (for salary)     │
│  ├── Leave               │  ├── Leave (for deductions)      │
│  ├── Recruitment         │  ├── SalaryStructure             │
│  ├── Performance         │  ├── PaySlips                    │
│  └── Training            │  ├── RunPayroll                  │
│                          │  └── Reports                     │
├─────────────────────────────────────────────────────────────┤
│  Each module is SELF-CONTAINED and can be exported alone    │
│  Permission-based access controls which module user sees    │
└─────────────────────────────────────────────────────────────┘
```

---

## Coding Standards

### CSS Rules
- ✅ Vanilla CSS only
- ✅ Each component `.js` + `.css` pair
- ✅ Use CSS variables from `theme.css`
- ❌ No inline styles
- ❌ No Tailwind

### Component Example
```jsx
// ✅ Correct
import './MyComponent.css';
export default function MyComponent() {
  return <div className="my-component">...</div>;
}

// ❌ Wrong
export default function MyComponent() {
  return <div style={{ color: 'red' }}>...</div>;
}
```

### Import Paths
```jsx
import Dashboard from '@/components/ClientAdmin/Dashboard/Dashboard';
import LeaveList from '@/components/ClientAdmin/HRMS/Leave/LeaveList/LeaveList';
import PaySlipList from '@/components/ClientAdmin/Payroll/PaySlips/PaySlipList/PaySlipList';
```

---

## Subscription Permission Flow

```
Login → Check Subscription → Show appropriate modules

User with "Payroll" subscription:
  → See: Account, Dashboard, Payroll/*
  → Hide: HRMS/*

User with "HRMS" subscription:
  → See: Account, Dashboard, HRMS/*
  → Hide: Payroll/*

User with "Both" subscription:
  → See: Account, Dashboard, HRMS/*, Payroll/*
```

---

## Theme System

### Overview
The app uses CSS variables defined in `styles/theme.css` for seamless light/dark mode switching. **Never hardcode colors** - always use theme variables.

### Color Variables

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--brand-primary` | #4f46e5 (Indigo) | #f59e0b (Amber) | Primary accent, buttons, links |
| `--brand-primary-light` | #eef2ff | rgba(245,158,11,0.2) | Backgrounds, hover states |
| `--bg-primary` | #f1f5f9 | #000000 | Page background |
| `--bg-secondary` | #ffffff | #0a0a0a | Cards, panels |
| `--bg-tertiary` | #f8fafc | #171717 | Hover states, subtle backgrounds |
| `--text-primary` | #0f172a | #fafafa | Main text |
| `--text-secondary` | #475569 | #a3a3a3 | Secondary text |
| `--text-muted` | #94a3b8 | #525252 | Muted/disabled text |
| `--border-color` | #cbd5e1 | #262626 | Borders |
| `--color-success` | #10b981 | #10b981 | Success states |
| `--color-danger` | #ef4444 | #f43f5e | Danger/error states |
| `--color-warning` | #f59e0b | #f59e0b | Warning states |

### CSS Best Practices

```css
/* ✅ CORRECT - Uses theme variables */
.my-component {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.my-button {
    background: var(--brand-primary);
    color: var(--accent-text);
}

/* ❌ WRONG - Hardcoded colors */
.my-component {
    background: #ffffff;
    color: #333333;
    border: 1px solid #e0e0e0;
}
```

### Component Theme Checklist

- [ ] All colors use CSS variables from `theme.css`
- [ ] No hardcoded color values (hex, rgb, etc.)
- [ ] No separate `[data-theme="dark"]` overrides (variables handle it)
- [ ] Test component in both light AND dark mode before commit
- [ ] Status colors use `--color-success/danger/warning`

### Adding New Theme Variables

If you need a new color variable:
1. Add to `:root` in `theme.css` for light mode
2. Add override in `[data-theme="dark"]` block
3. Use descriptive name: `--component-element-state`

```css
/* In theme.css */
:root {
    --chart-bar-inactive: #e2e8f0;
}

[data-theme="dark"] {
    --chart-bar-inactive: #404040;
}
```

---

## Checklist Before Commit

- [ ] No inline styles
- [ ] Using theme CSS variables
- [ ] Component in correct module folder
- [ ] CSS file alongside JS file
- [ ] Page only imports component
- [ ] Tested in both light AND dark mode
