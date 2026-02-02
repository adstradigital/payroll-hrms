from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.text import slugify
from apps.accounts.models import BaseModel, Employee
import uuid
import random
import string


class HelpCategory(BaseModel):
    """Categories for organizing help articles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name")
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Help Categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class HelpArticle(BaseModel):
    """Knowledge base articles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    category = models.ForeignKey(
        HelpCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles'
    )
    content = models.TextField(help_text="Article content in HTML or Markdown")
    author = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        related_name='help_articles'
    )
    view_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_published', 'is_featured']),
            models.Index(fields=['category', 'is_published']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def increment_view_count(self):
        """Increment the view count for this article"""
        self.view_count += 1
        self.save(update_fields=['view_count'])

    def get_related_articles(self, limit=5):
        """Get related articles from the same category"""
        return HelpArticle.objects.filter(
            category=self.category,
            is_published=True
        ).exclude(id=self.id)[:limit]


class SupportTicket(BaseModel):
    """Customer support tickets"""
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='support_tickets'
    )
    subject = models.CharField(max_length=200)
    category = models.ForeignKey(
        HelpCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets'
    )
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    description = models.TextField()
    assigned_to = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets'
    )
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket_number']),
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = self.generate_ticket_number()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_ticket_number():
        """Generate a unique ticket number"""
        prefix = "TKT"
        timestamp = timezone.now().strftime('%Y%m%d')
        random_suffix = ''.join(random.choices(string.digits, k=4))
        ticket_number = f"{prefix}-{timestamp}-{random_suffix}"
        
        # Ensure uniqueness
        while SupportTicket.objects.filter(ticket_number=ticket_number).exists():
            random_suffix = ''.join(random.choices(string.digits, k=4))
            ticket_number = f"{prefix}-{timestamp}-{random_suffix}"
        
        return ticket_number

    def can_be_closed_by(self, user):
        """Check if user can close this ticket"""
        if not hasattr(user, 'employee_profile'):
            return False
        employee = user.employee_profile
        # Ticket creator or admin can close
        return employee == self.employee or employee.is_admin


class TicketComment(BaseModel):
    """Comments/replies on support tickets"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='ticket_comments'
    )
    comment = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal notes visible only to admins"
    )

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment on {self.ticket.ticket_number} by {self.author.full_name}"


class TicketAttachment(BaseModel):
    """File attachments for support tickets"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='support/attachments/')
    uploaded_by = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='ticket_attachments'
    )

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Attachment for {self.ticket.ticket_number}"

    @property
    def filename(self):
        """Get the filename from the file path"""
        import os
        return os.path.basename(self.file.name)

    @property
    def file_size(self):
        """Get file size in bytes"""
        try:
            return self.file.size
        except:
            return 0


class ArticleFeedback(BaseModel):
    """Track article helpfulness"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.ForeignKey(
        HelpArticle,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='article_feedback'
    )
    is_helpful = models.BooleanField()

    class Meta:
        unique_together = ('article', 'user')
        verbose_name_plural = 'Article Feedback'

    def __str__(self):
        helpful_text = "helpful" if self.is_helpful else "not helpful"
        return f"{self.article.title} - {helpful_text}"
