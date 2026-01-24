from django.core.management.base import BaseCommand
from apps.accounts.models import Module, Permission

class Command(BaseCommand):
    help = 'Cleanup ghost modules and permissions'

    def handle(self, *args, **kwargs):
        ghost_modules = ['recruitment', 'training', 'assets', 'performance']
        
        self.stdout.write('Checking for ghost modules...')
        
        for code in ghost_modules:
            try:
                module = Module.objects.get(code=code)
                self.stdout.write(f"Found ghost module: {module.name} ({code})")
                
                # Delete permissions
                perms_count = Permission.objects.filter(module=module).count()
                Permission.objects.filter(module=module).delete()
                self.stdout.write(f"  - Deleted {perms_count} permissions")
                
                # Delete module
                module.delete()
                self.stdout.write(f"  - Deleted module {module.name}")
                
            except Module.DoesNotExist:
                self.stdout.write(f"Module {code} not found (already clean)")

        self.stdout.write(self.style.SUCCESS('Cleanup complete!'))
