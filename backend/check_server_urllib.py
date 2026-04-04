import urllib.request
import json

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/health/') as response:
        status_code = response.getcode()
        body = response.read()
        print(f"Status Code: {status_code}")
        print(f"Response: {json.loads(body)}")
except Exception as e:
    print(f"Error connecting to server: {e}")
