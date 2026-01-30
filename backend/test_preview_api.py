import requests
import json

url = "http://127.0.0.1:8000/api/attendance/holidays/preview/"
payload = {
    "year": 2026,
    "country": "IN",
    "include_national": True,
    "states": []
}

try:
    # Note: This might fail if auth is required, but let's see if we get a 401 or 404
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
