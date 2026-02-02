from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from .models import (
    HelpCategory, HelpArticle, SupportTicket,
    TicketComment, TicketAttachment, ArticleFeedback
)
from .serializers import (
    HelpCategorySerializer, HelpArticleListSerializer,
    HelpArticleDetailSerializer, SupportTicketListSerializer,
    SupportTicketDetailSerializer, CreateTicketSerializer,
    TicketCommentSerializer, TicketAttachmentSerializer,
    ArticleFeedbackSerializer
)


class HelpCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for help categories"""
    queryset = HelpCategory.objects.filter(is_active=True)
    serializer_class = HelpCategorySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        return HelpCategory.objects.filter(is_active=True).order_by('sort_order', 'name')


class HelpArticleViewSet(viewsets.ModelViewSet):
    """ViewSet for help articles"""
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = HelpArticle.objects.filter(is_published=True)
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        return queryset.select_related('category', 'author')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HelpArticleDetailSerializer
        return HelpArticleListSerializer

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to increment view count"""
        instance = self.get_object()
        instance.increment_view_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured articles"""
        articles = self.get_queryset().filter(is_featured=True)[:6]
        serializer = HelpArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular articles by view count"""
        articles = self.get_queryset().order_by('-view_count')[:10]
        serializer = HelpArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search articles by title or content"""
        query = request.query_params.get('q', '')
        if query:
            articles = self.get_queryset().filter(
                Q(title__icontains=query) | Q(content__icontains=query)
            )
        else:
            articles = self.get_queryset()
        
        serializer = HelpArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, slug=None):
        """Mark article as helpful or not helpful"""
        article = self.get_object()
        is_helpful = request.data.get('is_helpful', True)
        
        # Create or update feedback
        feedback, created = ArticleFeedback.objects.update_or_create(
            article=article,
            user=request.user,
            defaults={'is_helpful': is_helpful}
        )
        
        serializer = ArticleFeedbackSerializer(feedback)
        return Response(serializer.data)


class SupportTicketViewSet(viewsets.ModelViewSet):
    """ViewSet for support tickets"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all tickets, regular users only their own
        if hasattr(user, 'employee_profile') and user.employee_profile.is_admin:
            queryset = SupportTicket.objects.all()
        elif hasattr(user, 'employee_profile'):
            queryset = SupportTicket.objects.filter(employee=user.employee_profile)
        else:
            queryset = SupportTicket.objects.none()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by ticket number or subject
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(ticket_number__icontains=search) | Q(subject__icontains=search)
            )
        
        return queryset.select_related('employee', 'category', 'assigned_to').prefetch_related('comments', 'attachments')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateTicketSerializer
        elif self.action == 'retrieve':
            return SupportTicketDetailSerializer
        return SupportTicketListSerializer

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        """Get current user's tickets"""
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        tickets = SupportTicket.objects.filter(employee=request.user.employee_profile)
        serializer = SupportTicketListSerializer(tickets, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a ticket"""
        ticket = self.get_object()
        
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        comment_text = request.data.get('comment', '')
        is_internal = request.data.get('is_internal', False)
        
        if not comment_text:
            return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        comment = TicketComment.objects.create(
            ticket=ticket,
            author=request.user.employee_profile,
            comment=comment_text,
            is_internal=is_internal
        )
        
        serializer = TicketCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def upload_attachment(self, request, pk=None):
        """Upload a file attachment to a ticket"""
        ticket = self.get_object()
        
        if not hasattr(request.user, 'employee_profile'):
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        attachment = TicketAttachment.objects.create(
            ticket=ticket,
            file=file,
            uploaded_by=request.user.employee_profile
        )
        
        serializer = TicketAttachmentSerializer(attachment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def close_ticket(self, request, pk=None):
        """Close a support ticket"""
        ticket = self.get_object()
        
        if not ticket.can_be_closed_by(request.user):
            return Response(
                {'error': 'You do not have permission to close this ticket'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket.status = 'closed'
        ticket.closed_at = timezone.now()
        ticket.save()
        
        serializer = SupportTicketDetailSerializer(ticket)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reopen_ticket(self, request, pk=None):
        """Reopen a closed support ticket"""
        ticket = self.get_object()
        
        if not ticket.can_be_closed_by(request.user):
            return Response(
                {'error': 'You do not have permission to reopen this ticket'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket.status = 'open'
        ticket.closed_at = None
        ticket.save()
        
        serializer = SupportTicketDetailSerializer(ticket)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get ticket statistics"""
        user = request.user
        
        if hasattr(user, 'employee_profile') and user.employee_profile.is_admin:
            queryset = SupportTicket.objects.all()
        elif hasattr(user, 'employee_profile'):
            queryset = SupportTicket.objects.filter(employee=user.employee_profile)
        else:
            return Response({'error': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        stats = {
            'total': queryset.count(),
            'open': queryset.filter(status='open').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'resolved': queryset.filter(status='resolved').count(),
            'closed': queryset.filter(status='closed').count(),
        }
        
        return Response(stats)
