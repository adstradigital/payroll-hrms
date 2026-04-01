from django.contrib.auth.models import User
try:
    u = User.objects.get(username='mishal')
    print(f"User: {u.username}")
    profile = getattr(u, 'employee_profile', None)
    if profile:
        print(f"Profile ID: {profile.id}")
        print(f"Company Profile: {profile.company}")
        if profile.company:
            print(f"Company ID: {profile.company.id}")
    else:
        print("No Employee Profile found.")
    
    org = getattr(u, 'organization', None)
    if org:
        print(f"Organization: {org.name}")
    else:
        print("No Organization associated with User.")
except User.DoesNotExist:
    print("User 'mishal' not found.")
except Exception as e:
    print(f"Error: {e}")
