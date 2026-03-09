from django.contrib.auth import get_user_model
User = get_user_model()
if User.objects.filter(username='admin').exists():
    u = User.objects.get(username='admin')
    u.email = 'admin@example.com'
    u.set_password('admin')
    u.save()
    print('Superuser updated')
else:
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('Superuser created')
