# Frontend Development Guidelines

## Project Structure

```
frontend/
├── app/                    # Next.js App Router (ROUTING ONLY)
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page (redirect to dashboard)
│   ├── login/page.js      # Login route
│   └── dashboard/         # Dashboard routes
│       ├── page.js        # Dashboard home
│       ├── employees/     # /dashboard/employees
│       ├── attendance/    # /dashboard/attendance
│       ├── leave/         # /dashboard/leave
│       └── payroll/       # /dashboard/payroll
│
├── components/             # ALL UI COMPONENTS GO HERE
│   ├── Dashboard/         # Dashboard layout component
│   │   ├── Dashboard.js
│   │   └── Dashboard.css
│   ├── Sidebar/           # Sidebar with nested menu
│   │   ├── Sidebar.js
│   │   └── Sidebar.css
│   ├── ThemeToggle/       # Light/Dark mode toggle
│   │   ├── ThemeToggle.js
│   │   └── ThemeToggle.css
│   └── [ComponentName]/   # Each component in its own folder
│       ├── ComponentName.js
│       └── ComponentName.css
│
├── context/               # React Context providers
│   └── ThemeContext.js
│
├── styles/                # Global styles
│   ├── globals.css        # Global resets and base styles
│   └── theme.css          # CSS variables for theming
│
└── lib/                   # Utilities, API functions
    └── api.js
```

---

## Coding Standards

### 1. CSS Rules

✅ **DO:**
- Use vanilla CSS only (no Tailwind, styled-components, etc.)
- Each component has its own `.css` file in its folder
- Use CSS variables from `theme.css` for colors
- Use BEM-like naming: `.component-name__element--modifier`

❌ **DON'T:**
- No inline styles (`style={{}}`)
- No Tailwind classes
- No CSS-in-JS libraries
- No `!important` unless absolutely necessary

### 2. Theme Variables

Always use CSS variables from `theme.css`:

```css
/* ✅ Correct */
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

/* ❌ Wrong */
.my-component {
  background: #ffffff;
  color: #333333;
}
```

### 3. Component Structure

Each component folder contains:
- `ComponentName.js` - React component
- `ComponentName.css` - Component styles

```jsx
// ComponentName.js
'use client';
import './ComponentName.css';

export default function ComponentName({ props }) {
  return (
    <div className="component-name">
      {/* content */}
    </div>
  );
}
```

### 4. App Router Usage

The `/app` folder is for **routing only**:
- Pages import and render components
- No complex logic in page files
- Layout files handle shared structure

```jsx
// app/dashboard/employees/page.js
import EmployeeList from '@/components/EmployeeList/EmployeeList';

export default function EmployeesPage() {
  return <EmployeeList />;
}
```

---

## Theme System

### Light/Dark Mode

Theme is controlled via `data-theme` attribute on `<html>`:
- `data-theme="light"` - Light mode
- `data-theme="dark"` - Dark mode

### Color Naming Convention

```css
/* Backgrounds */
--bg-primary      /* Main background */
--bg-secondary    /* Card/panel backgrounds */
--bg-tertiary     /* Hover states */

/* Text */
--text-primary    /* Main text */
--text-secondary  /* Muted text */
--text-muted      /* Disabled/placeholder */

/* Accent Colors */
--accent-primary  /* Primary brand color */
--accent-success  /* Green - success states */
--accent-warning  /* Orange - warnings */
--accent-danger   /* Red - errors/delete */

/* Borders & Shadows */
--border-color    /* Default borders */
--shadow-sm       /* Small shadow */
--shadow-md       /* Medium shadow */
--shadow-lg       /* Large shadow */
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EmployeeList.js` |
| CSS files | PascalCase (match component) | `EmployeeList.css` |
| CSS classes | kebab-case | `.employee-list` |
| Folders | PascalCase | `EmployeeList/` |
| Variables | camelCase | `const employeeData` |

---

## Import Aliases

Use `@/` alias for imports:

```jsx
import Sidebar from '@/components/Sidebar/Sidebar';
import { useTheme } from '@/context/ThemeContext';
```

---

## Checklist Before Commit

- [ ] No inline styles
- [ ] Using theme CSS variables for all colors
- [ ] Component has its own CSS file
- [ ] CSS class names follow naming convention
- [ ] No Tailwind or other CSS frameworks
- [ ] Page only imports and renders components
