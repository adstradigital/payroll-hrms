import pymysql
import os
import environ
from pathlib import Path

# Initialize environ
env = environ.Env()
BASE_DIR = Path(__file__).resolve().parent
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

try:
    # Connect without database specified
    conn = pymysql.connect(
        host=env('DB_LOCAL_HOST', default='localhost'),
        user=env('DB_LOCAL_USER', default='root'),
        password=env('DB_LOCAL_PASSWORD', default='root@123'),
        port=int(env('DB_LOCAL_PORT', default=3306))
    )
    cursor = conn.cursor()
    db_name = env('DB_LOCAL_NAME', default='payroll_hrms')
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    print(f"Database '{db_name}' created or already exists.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
