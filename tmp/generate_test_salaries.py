import pandas as pd
import os

# Create directory for test files
output_dir = 'tests/salary_bulk_data'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Common headers
headers = ['Employee ID', 'Salary Structure', 'Basic Salary', 'Effective From', 'Remarks']

# Test Case 1: Simple Success (All valid)
data1 = [
    ['EMP001', 'Verification Structure', 50000, '2024-04-01', 'Annual Increment'],
    ['EMP002', 'Basic salary', 35000, '2024-04-01', 'Promotion'],
    ['EMP003', '', 42000, '2024-04-01', 'Correction']
]
pd.DataFrame(data1, columns=headers).to_excel(f'{output_dir}/01_simple_success.xlsx', index=False)

# Test Case 2: Component Overrides (Health Insurance)
data2 = [
    ['EMP001', '', 50000, '2024-04-01', 'Adding Health Benefit', 2500],
    ['EMP002', '', 35000, '2024-04-01', 'Standard Benefit', 1500]
]
pd.DataFrame(data2, columns=headers + ['Health Insurance']).to_excel(f'{output_dir}/02_component_overrides.xlsx', index=False)

# Test Case 3: Mixed (Some invalid EMP IDs)
data3 = [
    ['EMP001', '', 50000, '2024-04-01', 'Valid'],
    ['EMP_NONE', '', 35000, '2024-04-01', 'Invalid ID'],
    ['EMP003', '', 42000, '2024-04-01', 'Valid']
]
pd.DataFrame(data3, columns=headers).to_excel(f'{output_dir}/03_mixed_validation.xlsx', index=False)

# Test Case 4: Missing Mandatory Fields
data4 = [
    ['EMP001', '', None, '2024-04-01', 'Missing Basic Salary'],
    [None, '', 35000, '2024-04-01', 'Missing Employee ID'],
    ['EMP003', '', 42000, None, 'Missing Date (Defaults Today)']
]
pd.DataFrame(data4, columns=headers).to_excel(f'{output_dir}/04_missing_fields.xlsx', index=False)

# Test Case 5: Large Salary Values & Long Remarks
data5 = [
    ['EMP001', 'Verification Structure', 150000, '2024-01-01', 'Highly specialized senior role adjustment based on market research 2024'],
    ['EMP002', 'Verification Structure', 95000.50, '2024-02-15', 'Relocation and adjustment'],
    ['EMP003', '', 120000, '2024-03-01', 'Retention bonus and salary alignment']
]
pd.DataFrame(data5, columns=headers).to_excel(f'{output_dir}/05_complex_scenarios.xlsx', index=False)

print(f"Generated 5 test files in {output_dir}")
