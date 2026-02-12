import sys

files_to_clean = [
    r'c:\Users\misha\Desktop\payroll-hrms\backend\apps\payroll\serializers.py',
]

for file_path in files_to_clean:
    # Read the file in binary mode
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Count null bytes
    null_count = content.count(b'\x00')
    
    if null_count > 0:
        print(f'\n{file_path}:')
        print(f'  Found {null_count} null bytes')
        
        # Remove null bytes
        cleaned = content.replace(b'\x00', b'')
        
        # Write back
        with open(file_path, 'wb') as f:
            f.write(cleaned)
        
        print(f'  Removed {null_count} null bytes')
        print(f'  Original size: {len(content)} bytes')
        print(f'  New size: {len(cleaned)} bytes')
    else:
        print(f'\n{file_path}: No null bytes found')

print('\nAll files cleaned!')
