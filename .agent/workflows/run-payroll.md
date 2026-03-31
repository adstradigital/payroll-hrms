---
description: "Process for running and finalizing monthly payroll"
---

# 💹 How to Run Payroll

Follow these steps to generate and finalize the monthly payroll for your organization.

### Step 1: Pre-requisites (One-time Setup)
Ensure you have defined your salary components and structures:
1.  **Salary Components**: Go to `Payroll` -> `Salary Components` to define Basic, HRA, PF, etc.
2.  **Salary Structure**: Go to `Payroll` -> `Salary Structure` to group components into a template.
3.  **Employee Salary**: Go to `Payroll` -> `Employee Salary` and assign a structure to each employee.

### Step 2: Monthly Preparations
Before executing the payroll, ensure all monthly data is up-to-date:
1.  **Attendance**: Verify that all employees have clocked in/out correctly. The system will automatically calculate LOP (Loss of Pay) based on attendance.
2.  **Loans & Advances**: Ensure all approved loans and advances are recorded.
3.  **Bonus & Incentives**: Add any one-time payments for the month in `Payroll` -> `Bonus & Incentives`.
4.  **Expense Claims**: Ensure all "Expense Management" claims are approved if you want them paid this month.

### Step 3: Create a Payroll Period
1.  Navigate to `Payroll` -> `Run Payroll`.
2.  Click on **"Create New Period"** or similar (usually a button to start a new month).
3.  Select the **Month** and **Year** (e.g., March 2026).
4.  Set the **Start Date** and **End Date** for the period.
5.  Save the period. It should now appear in the list as `Draft` or `Pending`.

### Step 4: Execute Payroll Generation
1.  In the `Run Payroll` list, find your current period.
2.  Click the **"Generate Payroll"** or **"Execute"** button.
3.  The system will now:
    -   Fetch attendance and calculate LOP.
    -   Apply salary structures.
    -   Deduct EMIs for active loans.
    -   Add bonuses and approved expenses.
    -   Generate individual **Payslips**.

### Step 5: Review and Finalize
1.  Go to `Payroll` -> `Payslips`.
2.  Review a few payslips to ensure calculations (Basic, PF, Net Pay) are correct.
3.  If everything looks good, return to `Run Payroll` and mark the period as **"Completed"** or **"Posted"**.
4.  Once posted, employees will be able to view and download their payslips from their own dashboards.

> [!TIP]
> Always review the "Attendance Summary" before generating payroll to avoid incorrect LOP deductions.
