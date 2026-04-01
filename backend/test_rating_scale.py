import os
import django
import sys
import json

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.performance.serializers import RatingScaleSerializer

data = {
    "name": "Test Scale",
    "min_value": 0,
    "max_value": 5,
    "description": "testing",
    "is_active": True
}

serializer = RatingScaleSerializer(data=data)
if serializer.is_valid():
    print("Valid!")
    try:
        serializer.save()
        print("Saved successfully:", serializer.data)
    except Exception as e:
        print("Error during save:", e)
else:
    print("Serializer failed with errors:")
    print(json.dumps(serializer.errors, indent=2))
