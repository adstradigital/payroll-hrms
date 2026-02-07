# Generated migration for adding tax management settings

from django.db import migrations


def set_default_tax_management_setting(apps, schema_editor):
    """
    Set enable_tax_management to True for all existing organizations
    to maintain backward compatibility.
    """
    Organization = apps.get_model('accounts', 'Organization')
    
    for org in Organization.objects.all():
        if not org.settings:
            org.settings = {}
        
        # Only set if not already present
        if 'enable_tax_management' not in org.settings:
            org.settings['enable_tax_management'] = True
            org.save(update_fields=['settings'])


def reverse_migration(apps, schema_editor):
    """
    Reverse migration - remove the setting
    """
    Organization = apps.get_model('accounts', 'Organization')
    
    for org in Organization.objects.all():
        if org.settings and 'enable_tax_management' in org.settings:
            del org.settings['enable_tax_management']
            org.save(update_fields=['settings'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_alter_employee_user'),
    ]

    operations = [
        migrations.RunPython(set_default_tax_management_setting, reverse_migration),
    ]
