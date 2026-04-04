from django.db.models.signals import post_save, post_delete
from django.db.models import F
from django.dispatch import receiver
from .models import Application, JobOpening

@receiver(post_save, sender=Application)
def update_job_opening_count_on_save(sender, instance, created, **kwargs):
    """Atomic increment of applications_count when a new application is created."""
    if created:
        JobOpening.objects.filter(pk=instance.job_opening_id).update(
            applications_count=F('applications_count') + 1
        )

@receiver(post_delete, sender=Application)
def update_job_opening_count_on_delete(sender, instance, **kwargs):
    """Atomic decrement of applications_count when an application is deleted."""
    JobOpening.objects.filter(pk=instance.job_opening_id).update(
        applications_count=F('applications_count') - 1
    )
