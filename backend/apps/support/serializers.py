from rest_framework import serializers
from .models import (
    HelpCategory, HelpArticle, SupportTicket,
    TicketComment, TicketAttachment, ArticleFeedback
)
from apps.accounts.models import Employee


class HelpCategorySerializer(serializers.ModelSerializer):
    """Serializer for help categories"""
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = HelpCategory
        fields = ['id', 'name', 'slug', 'icon', 'description', 'sort_order', 'article_count']

    def get_article_count(self, obj):
        return obj.articles.filter(is_published=True).count()


class HelpArticleListSerializer(serializers.ModelSerializer):
    """Serializer for help article list view"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = HelpArticle
        fields = [
            'id', 'title', 'slug', 'category', 'category_name',
            'author_name', 'view_count', 'is_featured',
            'created_at', 'updated_at'
        ]


class HelpArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for help article detail view"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    related_articles = serializers.SerializerMethodField()

    class Meta:
        model = HelpArticle
        fields = [
            'id', 'title', 'slug', 'category', 'category_name',
            'content', 'author', 'author_name', 'view_count',
            'is_featured', 'is_published', 'created_at',
            'updated_at', 'related_articles'
        ]

    def get_related_articles(self, obj):
        related = obj.get_related_articles()
        return HelpArticleListSerializer(related, many=True).data


class TicketCommentSerializer(serializers.ModelSerializer):
    """Serializer for ticket comments"""
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)

    class Meta:
        model = TicketComment
        fields = [
            'id', 'ticket', 'author', 'author_name', 'author_email',
            'comment', 'is_internal', 'created_at'
        ]
        read_only_fields = ['author']


class TicketAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for ticket attachments"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    filename = serializers.CharField(read_only=True)
    file_size = serializers.IntegerField(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = [
            'id', 'ticket', 'file', 'file_url', 'filename',
            'file_size', 'uploaded_by', 'uploaded_by_name', 'created_at'
        ]
        read_only_fields = ['uploaded_by']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class SupportTicketListSerializer(serializers.ModelSerializer):
    """Serializer for support ticket list view"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'employee', 'employee_name', 'employee_id',
            'subject', 'category', 'category_name', 'priority', 'status',
            'assigned_to', 'assigned_to_name', 'comments_count',
            'created_at', 'updated_at'
        ]

    def get_comments_count(self, obj):
        return obj.comments.count()


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    """Serializer for support ticket detail view"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    comments = TicketCommentSerializer(many=True, read_only=True)
    attachments = TicketAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'employee', 'employee_name', 'employee_id',
            'subject', 'category', 'category_name', 'priority', 'status',
            'description', 'assigned_to', 'assigned_to_name',
            'comments', 'attachments', 'created_at', 'updated_at', 'closed_at'
        ]


class CreateTicketSerializer(serializers.ModelSerializer):
    """Serializer for creating support tickets"""
    
    class Meta:
        model = SupportTicket
        fields = ['subject', 'category', 'priority', 'description']

    def create(self, validated_data):
        # Get employee from request user
        request = self.context.get('request')
        if request and hasattr(request.user, 'employee_profile'):
            validated_data['employee'] = request.user.employee_profile
        return super().create(validated_data)


class ArticleFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for article feedback"""
    
    class Meta:
        model = ArticleFeedback
        fields = ['id', 'article', 'is_helpful', 'created_at']
        read_only_fields = ['user']
