from django.apps import apps
from django.db.models.deletion import ProtectedError
import time

# Models to preserve
EXCLUDE_MODELS = [
    'admin.LogEntry',
    'auth.Permission',
    'auth.Group',
    'auth.User',
    'contenttypes.ContentType',
    'sessions.Session',
    'accounts.Organization',
    'accounts.Company',
    'subscriptions.Package',
]

def cleanup_data():
    print("Starting robust cleanup...")
    models_to_delete = [
        model for model in apps.get_models() 
        if model._meta.label not in EXCLUDE_MODELS
    ]
    
    passes = 0
    max_passes = 10
    
    while models_to_delete and passes < max_passes:
        passes += 1
        print(f"Pass {passes}...")
        still_to_delete = []
        
        for model in models_to_delete:
            label = model._meta.label
            if not model.objects.exists():
                continue
                
            try:
                count = model.objects.count()
                model.objects.all().delete()
                print(f"  Successfully deleted {count} records from {label}")
            except ProtectedError:
                # print(f"  Delayed {label} due to protection")
                still_to_delete.append(model)
            except Exception as e:
                print(f"  Unexpected error on {label}: {e}")
        
        models_to_delete = still_to_delete
        if not still_to_delete:
            break
            
    if not models_to_delete:
        print("Finalizing... Cleaned all business data successfully.")
    else:
        remaining = [m._meta.label for m in models_to_delete]
        print(f"Cleanup finished with some items remaining due to protection: {remaining}")

if __name__ == "__main__":
    cleanup_data()
