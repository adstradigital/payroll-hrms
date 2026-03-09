import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'
USERNAME = 'admin'
PASSWORD = 'admin'

def get_token():
    url = f"{BASE_URL}/account/auth/login/"
    data = {'username': 'admin', 'password': PASSWORD}
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"Failed to get token: {response.text}")
        return None

def test_job_openings(token):
    headers = {'Authorization': f'Bearer {token}'}
    
    # Create Job Opening
    print("\nTesting Create Job Opening...")
    data = {
        "title": "Senior Software Engineer",
        "department": "ENGINEERING",
        "location": "New York, NY",
        "employment_type": "FULL_TIME",
        "experience_level": "SENIOR",
        "salary_min": "120000.00",
        "salary_max": "180000.00",
        "description": "We are looking for a Senior Software Engineer...",
        "status": "OPEN",
        "priority": "HIGH"
    }
    response = requests.post(f"{BASE_URL}/recruitment/job-openings/", json=data, headers=headers)
    if response.status_code == 201:
        print("Success: Job Opening Created")
        job_id = response.json()['data']['id']
    else:
        print(f"Failed: {response.text}")
        return None

    # List Job Openings
    print("\nTesting List Job Openings...")
    response = requests.get(f"{BASE_URL}/recruitment/job-openings/", headers=headers)
    if response.status_code == 200:
        print(f"Success: Retrieved {len(response.json()['results'])} job openings")
    else:
        print(f"Failed: {response.text}")
        
    return job_id

def test_candidates(token, job_id):
    headers = {'Authorization': f'Bearer {token}'}
    
    # Create Candidate
    print("\nTesting Create Candidate...")
    data = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "555-0123",
        "status": "NEW",
        "source": "LINKEDIN"
    }
    response = requests.post(f"{BASE_URL}/recruitment/candidates/", data=data, headers=headers)
    if response.status_code == 201:
        print("Success: Candidate Created")
        candidate_id = response.json()['data']['id']
    else:
        print(f"Failed: {response.text}")
        return None

    # List Candidates
    print("\nTesting List Candidates...")
    response = requests.get(f"{BASE_URL}/recruitment/candidates/", headers=headers)
    if response.status_code == 200:
        print(f"Success: Retrieved {len(response.json()['results'])} candidates")
    else:
        print(f"Failed: {response.text}")

    # Apply to Job
    if job_id and candidate_id:
        print("\nTesting Apply to Job...")
        data = {"job_opening_id": job_id}
        response = requests.post(f"{BASE_URL}/recruitment/candidates/{candidate_id}/apply/", json=data, headers=headers)
        if response.status_code == 201:
            print("Success: Candidate Applied to Job")
        else:
             print(f"Failed: {response.text}")

def main():
    print("Starting Recruitment API Verification...")
    token = get_token()
    if token:
        print("Authentication Successful")
        job_id = test_job_openings(token)
        if job_id:
            test_candidates(token, job_id)
    print("\nVerification Complete")

if __name__ == "__main__":
    main()
