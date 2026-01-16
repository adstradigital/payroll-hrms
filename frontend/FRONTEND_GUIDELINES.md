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

## Checklist Before Commit

- [ ] No inline styles
- [ ] Using theme CSS variables
- [ ] Component in correct module folder
- [ ] CSS file alongside JS file
- [ ] Page only imports component
