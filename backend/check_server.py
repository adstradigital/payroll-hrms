import requests

try:
    response = requests.get('http://127.0.0.1:8000/api/health/')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error connecting to server: {e}")
