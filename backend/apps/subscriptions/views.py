from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Package, Subscription, Payment, FeatureUsage
from .serializers import (
    PackageListSerializer, PackageDetailSerializer,
    SubscriptionListSerializer, SubscriptionDetailSerializer,
    PaymentListSerializer, PaymentDetailSerializer,
    FeatureUsageSerializer
)

logger = logging.getLogger(__name__)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==================== PACKAGE VIEWS ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def package_list(request):
    """
    GET: List all active packages (public endpoint for pricing page)
    """
    try:
        queryset = Package.objects.filter(is_active=True).order_by('sort_order', 'monthly_price')
        serializer = PackageListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error in package_list: {str(e)}")
        return Response(
            {'error': 'An error occurred while fetching packages.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def package_detail(request, pk):
    """
    GET: Retrieve package details (public endpoint)
    """
    try:
        package = get_object_or_404(Package, pk=pk, is_active=True)
        serializer = PackageDetailSerializer(package)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error in package_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while fetching package details.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def package_admin_list_create(request):
    """
    Admin endpoint
    GET: List all packages (including inactive)
    POST: Create a new package
    """
    try:
        if request.method == 'GET':
            queryset = Package.objects.all().order_by('sort_order', 'monthly_price')
            
            # Apply filters
            package_type = request.query_params.get('package_type', None)
            is_active = request.query_params.get('is_active', None)
            
            if package_type:
                queryset = queryset.filter(package_type=package_type)
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            serializer = PackageDetailSerializer(queryset, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = PackageDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Package created: {serializer.data['name']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in package_admin_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def package_admin_detail(request, pk):
    """
    Admin endpoint
    GET: Retrieve package details
    PUT/PATCH: Update package
    DELETE: Delete package
    """
    try:
        package = get_object_or_404(Package, pk=pk)
        
        if request.method == 'GET':
            serializer = PackageDetailSerializer(package)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = PackageDetailSerializer(package, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Package updated: {package.name} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            package_name = package.name
            package.delete()
            logger.info(f"Package deleted: {package_name} by {request.user.username}")
            return Response(
                {'message': 'Package deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in package_admin_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== SUBSCRIPTION VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subscription_list_create(request):
    """
    GET: List all subscriptions (filtered by user's organizations)
    POST: Create a new subscription
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            organization_id = request.query_params.get('organization', None)
            status_filter = request.query_params.get('status', None)
            
            queryset = Subscription.objects.select_related('organization', 'package')
            
            # Apply filters
            if organization_id:
                queryset = queryset.filter(organization_id=organization_id)
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            # Pagination
            paginator = StandardResultsSetPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = SubscriptionListSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            serializer = SubscriptionDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                # Set trial end date if creating trial
                subscription_data = serializer.validated_data
                if subscription_data.get('status') == 'trial':
                    package = subscription_data.get('package')
                    trial_days = package.trial_days if package else 14
                    serializer.validated_data['trial_end_date'] = timezone.now().date() + timedelta(days=trial_days)
                    serializer.validated_data['current_period_end'] = serializer.validated_data['trial_end_date']
                
                serializer.save(created_by=request.user)
                logger.info(f"Subscription created for org: {serializer.data['organization_name']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in subscription_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_detail(request, pk):
    """
    GET: Retrieve subscription details
    PUT/PATCH: Update subscription
    DELETE: Delete subscription
    """
    try:
        subscription = get_object_or_404(
            Subscription.objects.select_related('organization', 'package'),
            pk=pk
        )
        
        if request.method == 'GET':
            serializer = SubscriptionDetailSerializer(subscription)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = SubscriptionDetailSerializer(
                subscription, data=request.data, partial=partial
            )
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Subscription updated for org: {subscription.organization.name} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            org_name = subscription.organization.name
            subscription.delete()
            logger.info(f"Subscription deleted for org: {org_name} by {request.user.username}")
            return Response(
                {'message': 'Subscription deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in subscription_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscription_renew(request, pk):
    """
    POST: Renew subscription for next period
    """
    try:
        subscription = get_object_or_404(Subscription, pk=pk)
        
        billing_cycle = request.data.get('billing_cycle', subscription.billing_cycle)
        
        subscription.renew_subscription(billing_cycle=billing_cycle)
        
        logger.info(f"Subscription renewed for org: {subscription.organization.name} by {request.user.username}")
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error in subscription_renew: {str(e)}")
        return Response(
            {'error': 'An error occurred while renewing subscription.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscription_cancel(request, pk):
    """
    POST: Cancel subscription
    """
    try:
        subscription = get_object_or_404(Subscription, pk=pk)
        
        subscription.status = 'cancelled'
        subscription.cancelled_at = timezone.now()
        subscription.auto_renew = False
        subscription.save()
        
        logger.info(f"Subscription cancelled for org: {subscription.organization.name} by {request.user.username}")
        
        serializer = SubscriptionDetailSerializer(subscription)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error in subscription_cancel: {str(e)}")
        return Response(
            {'error': 'An error occurred while cancelling subscription.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_usage(request, pk):
    """
    GET: Get subscription usage statistics
    """
    try:
        subscription = get_object_or_404(
            Subscription.objects.select_related('organization', 'package'),
            pk=pk
        )
        
        usage_stats = {
            'subscription_id': str(subscription.id),
            'organization_name': subscription.organization.name,
            'package_name': subscription.package.name,
            'status': subscription.status,
            'days_remaining': subscription.days_remaining,
            'limits': {
                'max_employees': subscription.package.max_employees,
                'max_companies': subscription.package.max_companies,
                'max_storage_gb': subscription.package.max_storage_gb,
            },
            'usage': {
                'employee_count': subscription.employee_count,
                'company_count': subscription.company_count,
                'storage_used_gb': float(subscription.storage_used_gb),
            },
            'can_add_employee': subscription.can_add_employee(),
            'can_add_company': subscription.can_add_company(),
        }
        
        return Response(usage_stats)
    
    except Exception as e:
        logger.error(f"Error in subscription_usage: {str(e)}")
        return Response(
            {'error': 'An error occurred while fetching usage statistics.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== PAYMENT VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_list_create(request):
    """
    GET: List all payments (filtered by subscription)
    POST: Create a new payment record
    """
    try:
        if request.method == 'GET':
            subscription_id = request.query_params.get('subscription', None)
            status_filter = request.query_params.get('status', None)
            gateway = request.query_params.get('gateway', None)
            
            queryset = Payment.objects.select_related('subscription__organization')
            
            if subscription_id:
                queryset = queryset.filter(subscription_id=subscription_id)
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            if gateway:
                queryset = queryset.filter(gateway=gateway)
            
            # Pagination
            paginator = StandardResultsSetPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = PaymentListSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            serializer = PaymentDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Payment created: {serializer.data['transaction_id']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in payment_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def payment_detail(request, pk):
    """
    GET: Retrieve payment details
    PUT/PATCH: Update payment
    """
    try:
        payment = get_object_or_404(
            Payment.objects.select_related('subscription__organization'),
            pk=pk
        )
        
        if request.method == 'GET':
            serializer = PaymentDetailSerializer(payment)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = PaymentDetailSerializer(payment, data=request.data, partial=partial)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Payment updated: {payment.transaction_id} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in payment_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def payment_webhook(request, gateway):
    """
    POST: Process payment gateway webhooks
    """
    try:
        # Log webhook received
        logger.info(f"Webhook received from {gateway}")
        
        # Get webhook payload
        payload = request.data
        
        # Process based on gateway
        if gateway == 'stripe':
            # TODO: Verify Stripe webhook signature
            # TODO: Process Stripe event
            pass
        
        elif gateway == 'razorpay':
            # TODO: Verify Razorpay webhook signature
            # TODO: Process Razorpay event
            pass
        
        else:
            return Response(
                {'error': f'Unknown gateway: {gateway}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'status': 'received'})
    
    except Exception as e:
        logger.error(f"Error in payment_webhook: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing webhook.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== FEATURE USAGE VIEWS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feature_usage_list(request):
    """
    GET: List feature usage for analytics
    """
    try:
        subscription_id = request.query_params.get('subscription', None)
        feature_name = request.query_params.get('feature', None)
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        queryset = FeatureUsage.objects.select_related('subscription__organization')
        
        if subscription_id:
            queryset = queryset.filter(subscription_id=subscription_id)
        
        if feature_name:
            queryset = queryset.filter(feature_name=feature_name)
        
        if start_date:
            queryset = queryset.filter(usage_date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(usage_date__lte=end_date)
        
        # Pagination
        paginator = StandardResultsSetPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        serializer = FeatureUsageSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error in feature_usage_list: {str(e)}")
        return Response(
            {'error': 'An error occurred while fetching usage data.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feature_usage_summary(request, subscription_id):
    """
    GET: Get aggregated feature usage summary for a subscription
    """
    try:
        subscription = get_object_or_404(Subscription, pk=subscription_id)
        
        # Get usage summary grouped by feature
        usage_summary = FeatureUsage.objects.filter(
            subscription=subscription
        ).values('feature_name').annotate(
            total_usage=Sum('usage_count')
        ).order_by('-total_usage')
        
        # Get recent usage (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_usage = FeatureUsage.objects.filter(
            subscription=subscription,
            usage_date__gte=thirty_days_ago
        ).values('feature_name', 'usage_date').annotate(
            daily_usage=Sum('usage_count')
        ).order_by('usage_date')
        
        return Response({
            'subscription_id': str(subscription_id),
            'total_by_feature': list(usage_summary),
            'daily_usage': list(recent_usage)
        })
    
    except Exception as e:
        logger.error(f"Error in feature_usage_summary: {str(e)}")
        return Response(
            {'error': 'An error occurred while fetching usage summary.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
