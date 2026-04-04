from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.db.models import Q
from datetime import date
import logging
from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveEncashment, LeaveSettings
from .serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer,
    LeaveRequestSerializer, LeaveRequestApprovalSerializer,
    LeaveEncashmentSerializer, LeaveEncashmentProcessSerializer,
    LeaveSettingsSerializer
)
from apps.accounts.permissions import is_client_admin
from apps.audit.utils import log_activity

logger = logging.getLogger(__name__)

def get_client_company(user):
    """
    Safely retrieve the organization/company context for the current user.
    """
    try:
        if user.is_superuser:
            from apps.accounts.models import Organization
            return Organization.objects.first()
        
        if hasattr(user, 'employee_profile') and user.employee_profile:
            return user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            return user.organization
    except Exception as e:
        logger.error(f"Error retrieving company context for user {user.username}: {str(e)}")
    
    return None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_type_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = LeaveType.objects.filter(company=company)
            # Add simple filters if needed
            serializer = LeaveTypeSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveTypeSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(company=company)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def leave_type_detail(request, pk):
    try:
        company = get_client_company(request.user)
        leave_type = get_object_or_404(LeaveType, pk=pk, company=company)
        if request.method == 'GET':
            return Response(LeaveTypeSerializer(leave_type).data)
        elif request.method in ['PUT', 'PATCH']:
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveTypeSerializer(leave_type, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            leave_type.delete(); return Response(status=204)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_balance_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = LeaveBalance.objects.filter(employee__company=company).select_related('employee', 'leave_type')
            employee_id = request.query_params.get('employee')
            year = request.query_params.get('year')
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            if year: queryset = queryset.filter(year=year)
            return Response(LeaveBalanceSerializer(queryset, many=True).data)
        elif request.method == 'POST':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveBalanceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(); return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def leave_balance_detail(request, pk):
    try:
        company = get_client_company(request.user)
        balance = get_object_or_404(LeaveBalance, pk=pk, employee__company=company)
        if request.method == 'GET': return Response(LeaveBalanceSerializer(balance).data)
        elif request.method in ['PUT', 'PATCH']:
            if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveBalanceSerializer(balance, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid(): serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
            balance.delete(); return Response(status=204)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leave_balance_my_balance(request):
    try:
        employee_id = request.query_params.get('employee')
        year = request.query_params.get('year', date.today().year)
        if not employee_id: return Response({'error': 'employee parameter required'}, status=400)
        balances = LeaveBalance.objects.filter(employee_id=employee_id, year=year)
        return Response(LeaveBalanceSerializer(balances, many=True).data)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_balance_allocate(request):
    try:
        if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
        employee_ids = request.data.get('employees', [])
        year = request.data.get('year', date.today().year)
        company_id = request.data.get('company')
        if not company_id: return Response({'error': 'company parameter required'}, status=400)
        leave_types = LeaveType.objects.filter(company_id=company_id, is_active=True)
        created = 0
        for emp_id in employee_ids:
            for lt in leave_types:
                _, was_created = LeaveBalance.objects.get_or_create(employee_id=emp_id, leave_type=lt, year=year, defaults={'allocated': lt.days_per_year})
                if was_created: created += 1
        return Response({'message': f'Created {created} leave balance records'})
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_balance_run_accrual(request):
    try:
        if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
        from django.db.models import F
        company_id = request.data.get('company')
        if not company_id: return Response({'error': 'company parameter required'}, status=400)
        today = date.today()
        leave_types = LeaveType.objects.filter(company_id=company_id, is_active=True)
        accrued_count = 0
        for lt in leave_types:
            if lt.accrual_type == 'monthly':
                accrual_amount = lt.days_per_year / 12
                accrued_count += LeaveBalance.objects.filter(leave_type=lt, year=today.year).update(allocated=F('allocated') + accrual_amount)
            elif lt.accrual_type == 'quarterly' and today.month in [1, 4, 7, 10]:
                accrual_amount = lt.days_per_year / 4
                accrued_count += LeaveBalance.objects.filter(leave_type=lt, year=today.year).update(allocated=F('allocated') + accrual_amount)
        return Response({'message': f'Accrued leaves for {accrued_count} records'})
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_request_list_create(request):
    try:
        company = get_client_company(request.user)
        if request.method == 'GET':
            queryset = LeaveRequest.objects.filter(employee__company=company).select_related('employee', 'leave_type', 'approved_by')
            employee_id = request.query_params.get('employee')
            status_filter = request.query_params.get('status')
            if employee_id: queryset = queryset.filter(employee_id=employee_id)
            if status_filter: queryset = queryset.filter(status=status_filter)
            return Response(LeaveRequestSerializer(queryset.order_by('-created_at'), many=True).data)
        elif request.method == 'POST':
            serializer = LeaveRequestSerializer(data=request.data)
            if serializer.is_valid():
                leave_request = serializer.save()
                balance, _ = LeaveBalance.objects.get_or_create(employee=leave_request.employee, leave_type=leave_request.leave_type, year=leave_request.start_date.year, defaults={'allocated': leave_request.leave_type.days_per_year})
                balance.pending += leave_request.days_count; balance.save()
                
                # Send notification to Dept Head
                try:
                    from .emails import send_leave_request_to_dept_head
                    send_leave_request_to_dept_head(leave_request)
                except Exception as e:
                    logger.error(f"Failed to trigger dept head leave notification: {str(e)}")
                
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def leave_request_detail(request, pk):
    try:
        company = get_client_company(request.user)
        leave_request = get_object_or_404(LeaveRequest, pk=pk, employee__company=company)
        if request.method == 'GET': return Response(LeaveRequestSerializer(leave_request).data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = LeaveRequestSerializer(leave_request, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid(): serializer.save(); return Response(serializer.data)
            return Response(serializer.errors, status=400)
        elif request.method == 'DELETE':
            leave_request.delete(); return Response(status=204)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_request_process(request, pk):
    try:
        if not is_client_admin(request.user): return Response({'error': 'Admin access required'}, status=403)
        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        serializer = LeaveRequestApprovalSerializer(data=request.data)
        if serializer.is_valid():
            action_type = serializer.validated_data['action']
            if action_type == 'approve':
                from apps.accounts.models import Employee
                approver_id = request.data.get('approver_id')
                approver = None
                if approver_id and not str(approver_id).startswith('admin-'):
                    try:
                        approver = Employee.objects.filter(id=approver_id).first()
                    except Exception:
                        pass
                
                if not approver:
                    approver = getattr(request.user, 'employee_profile', None)
                
                leave_request.approve(approver)
                
                log_activity(
                    user=request.user,
                    action_type='APPROVE',
                    module='LEAVE',
                    description=f"Leave request {leave_request.id} approved",
                    reference_id=str(leave_request.id)
                )
                
                return Response({'message': 'Leave approved successfully'})
            else:
                reason = serializer.validated_data.get('rejection_reason', '')
                leave_request.reject(reason)
                
                log_activity(
                    user=request.user,
                    action_type='REJECT',
                    module='LEAVE',
                    description=f"Leave request {leave_request.id} rejected",
                    reference_id=str(leave_request.id),
                    new_value={'reason': reason}
                )
                
                return Response({'message': 'Leave rejected'})
        return Response(serializer.errors, status=400)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_request_cancel(request, pk):
    try:
        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        if leave_request.status == 'cancelled': return Response({'error': 'Leave is already cancelled'}, status=400)
        if leave_request.status == 'rejected': return Response({'error': 'Rejected leave cannot be cancelled'}, status=400)
        old_status = leave_request.status; leave_request.status = 'cancelled'; leave_request.save()
        try:
            balance = LeaveBalance.objects.get(employee=leave_request.employee, leave_type=leave_request.leave_type, year=leave_request.start_date.year)
            if old_status == 'pending': balance.pending -= leave_request.days_count
            elif old_status == 'approved': balance.used -= leave_request.days_count
            balance.save()
            
            log_activity(
                user=request.user,
                action_type='UPDATE',
                module='LEAVE',
                description=f"Leave request {leave_request.id} cancelled",
                reference_id=str(leave_request.id)
            )
            
            return Response({'message': 'Leave cancelled and balance restored'})
        except LeaveBalance.DoesNotExist: return Response({'message': 'Leave cancelled (no balance record found to restore)'})
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leave_request_stats(request):
    try:
        from django.db.models import Count
        from datetime import date, timedelta
        company = get_client_company(request.user)
        employee_id = request.query_params.get('employee')
        queryset = LeaveRequest.objects.filter(employee__company=company)
        if employee_id: queryset = queryset.filter(employee_id=employee_id)
        today = date.today()
        stats = {'pending': queryset.filter(status='pending').count(), 'approved': queryset.filter(status='approved').count(), 'rejected': queryset.filter(status='rejected').count(), 
                 'on_leave_today': queryset.filter(status='approved', start_date__lte=today, end_date__gte=today).count()}
        type_dist = queryset.values('leave_type__name').annotate(count=Count('id'))
        stats['type_distribution'] = {item['leave_type__name']: item['count'] for item in type_dist}
        recent_list = queryset.order_by('-created_at')[:5]
        stats['recent_requests'] = LeaveRequestSerializer(recent_list, many=True).data
        return Response(stats)
    except Exception as e:
        import traceback
        logger.error(f"Error in {request.resolver_match.func.__name__ if hasattr(request, 'resolver_match') else 'Leave View'}: {str(e)}\n{traceback.format_exc()}")
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([]) # Public but signed
def leave_request_email_process(request, pk):
    """
    Process leave approval/rejection from email links.
    """
    try:
        from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
        from django.http import HttpResponse
        
        token = request.query_params.get('token')
        action = request.query_params.get('action')
        
        if not token or not action:
            return HttpResponse("<h1>Invalid Request</h1><p>Missing token or action.</p>", status=400)
            
        signer = TimestampSigner()
        try:
            # Signer expects the max_age in seconds (e.g., 2 days = 172800)
            original_value = signer.unsign(token, max_age=172800)
            expected_value = f"{pk}:{action}"
            
            if original_value != expected_value:
                return HttpResponse("<h1>Invalid Token</h1><p>The token does not match this request.</p>", status=403)
                
        except SignatureExpired:
            return HttpResponse("<h1>Link Expired</h1><p>This approval link has expired (48h limit).</p>", status=403)
        except BadSignature:
            return HttpResponse("<h1>Invalid Signature</h1><p>The link is malformed or tampered with.</p>", status=403)

        leave_request = get_object_or_404(LeaveRequest, pk=pk)
        
        if leave_request.status != 'pending':
            message = f"already {leave_request.status.capitalize()}"
            color = "#64748b" # Gray
        else:
            if action == 'approve':
                # Identify the head performing the action
                approver = leave_request.employee.department.head if leave_request.employee.department else None
                leave_request.approve(approver)
                message = "Approved successfully."
                color = "#10b981"
            elif action == 'reject':
                leave_request.reject("Rejected via email notification.")
                message = "Rejected successfully."
                color = "#ef4444"
            else:
                return HttpResponse("<h1>Invalid Action</h1>", status=400)

        html_response = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Leave Processed</title>
            <style>
                body {{ font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f4; }}
                .card {{ background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }}
                h1 {{ color: {color}; margin-bottom: 10px; }}
                p {{ color: #666; line-height: 1.6; }}
                .btn {{ display: inline-block; margin-top: 20px; padding: 10px 20px; background: #1e293b; color: white; text-decoration: none; border-radius: 6px; }}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>{message}</h1>
                <p>The leave request for <strong>{leave_request.employee.full_name}</strong> has been processed.</p>
                <a href="/" class="btn">Go to Dashboard</a>
            </div>
        </body>
        </html>
        """
        return HttpResponse(html_response)
        
    except Exception as e:
        logger.error(f"Error processing email leave link: {str(e)}")
        return HttpResponse(f"<h1>Server Error</h1><p>{str(e)}</p>", status=500)


# ─────────────────────────────────────────────
# Leave Settings Views
# ─────────────────────────────────────────────

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def leave_settings_detail(request):
    """Retrieve or update global leave settings for the company"""
    try:
        company = get_client_company(request.user)
        # Ensure settings exist
        settings, created = LeaveSettings.objects.get_or_create(company=company)
        
        if request.method == 'GET':
            return Response(LeaveSettingsSerializer(settings).data)
            
        elif request.method == 'PATCH':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin permissions required to modify settings'}, status=403)
                
            serializer = LeaveSettingsSerializer(settings, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
            
    except Exception as e:
        logger.error(f"Error in leave_settings_detail: {str(e)}")
        return Response({'error': str(e)}, status=500)


# ─────────────────────────────────────────────
# Leave Encashment Views
# ─────────────────────────────────────────────

def _get_employee_instance(employee_id, company, request_user=None):
    """
    Robust employee lookup. Resolves employee by:
    1. Primary Key (UUID)
    2. employee_id (public character field)
    3. User PK fallback (if provided ID matches request_user.id)
    """
    from apps.accounts.models import Employee as EmpModel
    
    # Empty ID – try to use current user
    if not employee_id:
        if request_user and hasattr(request_user, 'employee_profile'):
            return request_user.employee_profile
        return None

    # Try standard lookups
    try:
        return EmpModel.objects.get(
            Q(pk=employee_id) | Q(employee_id=employee_id),
            company=company
        )
    except (EmpModel.DoesNotExist, ValidationError):
        # Fallback – check if ID matches User PK
        if request_user and str(request_user.id) == str(employee_id) and hasattr(request_user, 'employee_profile'):
            return request_user.employee_profile
    return None


def _get_employee_daily_rate(employee):
    """
    Compute the daily salary rate for an employee.
    Uses: gross_salary / 26  (standard Indian payroll practice).
    Falls back to 0 if no salary record is found.
    """
    from decimal import Decimal
    try:
        from apps.payroll.models import EmployeeSalary
        salary = EmployeeSalary.objects.filter(employee=employee, is_current=True).first()
        if salary and salary.gross_salary:
            return (salary.gross_salary / Decimal('26')).quantize(Decimal('0.01'))
    except Exception as e:
        logger.warning(f"Could not compute daily rate for {employee}: {e}")
    return Decimal('0')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_encashment_list_create(request):
    """
    GET  – list encashments (admin: all in company; employee: own only)
    POST – employee submits an encashment request
    """
    try:
        company = get_client_company(request.user)

        if request.method == 'GET':
            queryset = LeaveEncashment.objects.filter(
                employee__company=company
            ).select_related('employee', 'leave_type', 'approved_by')

            # Non-admins only see their own records
            if not is_client_admin(request.user):
                employee = getattr(request.user, 'employee_profile', None)
                if employee:
                    queryset = queryset.filter(employee=employee)
                else:
                    return Response([])

            # Filters
            emp_id = request.query_params.get('employee')
            status_filter = request.query_params.get('status')
            year_filter = request.query_params.get('year')
            if emp_id:
                queryset = queryset.filter(employee_id=emp_id)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if year_filter:
                queryset = queryset.filter(year=year_filter)

            return Response(LeaveEncashmentSerializer(queryset, many=True).data)

        elif request.method == 'POST':
            from decimal import Decimal

            # Check if encashment is enabled globally
            settings, _ = LeaveSettings.objects.get_or_create(company=company)
            if not settings.is_encashment_enabled:
                return Response({'error': 'Leave encashment is currently disabled for this organization.'}, status=400)

            employee_id = request.data.get('employee')
            leave_type_id = request.data.get('leave_type')
            days_requested = request.data.get('days_encashed')
            year = request.data.get('year', date.today().year)
            remarks = request.data.get('remarks', '')

            if not all([employee_id, leave_type_id, days_requested]):
                return Response({'error': 'employee, leave_type and days_encashed are required'}, status=400)

            # Validate leave type is encashable
            leave_type = get_object_or_404(LeaveType, pk=leave_type_id, company=company)
            if not leave_type.is_encashable:
                return Response({'error': f'{leave_type.name} is not eligible for encashment'}, status=400)

            # Validate employee belongs to this company
            employee = _get_employee_instance(employee_id, company, request.user)
            if not employee:
                return Response({'error': 'Employee record not found'}, status=404)

            days_dec = Decimal(str(days_requested))
            if days_dec <= 0:
                return Response({'error': 'days_encashed must be greater than 0'}, status=400)

            # Check available balance
            try:
                balance = LeaveBalance.objects.get(employee=employee, leave_type=leave_type, year=year)
                if balance.available < days_dec:
                    return Response({
                        'error': f'Insufficient balance. Available: {balance.available} days'
                    }, status=400)
            except LeaveBalance.DoesNotExist:
                return Response({'error': 'No leave balance record found for this employee and leave type'}, status=400)

            # Compute daily rate
            daily_rate = _get_employee_daily_rate(employee)

            # Deduct from leave balance (treated as used)
            balance.used += days_dec
            balance.save()

            # Create encashment record
            encashment = LeaveEncashment.objects.create(
                employee=employee,
                leave_type=leave_type,
                year=year,
                days_encashed=days_dec,
                daily_rate=daily_rate,
                remarks=remarks,
            )

            log_activity(
                user=request.user,
                action_type='CREATE',
                module='LEAVE',
                description=f"Leave encashment requested: {days_dec} days of {leave_type.name} by {employee.full_name}",
                reference_id=str(encashment.id)
            )

            return Response(LeaveEncashmentSerializer(encashment).data, status=201)

    except Exception as e:
        import traceback
        logger.error(f"Error in leave_encashment_list_create: {str(e)}\n{traceback.format_exc()}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def leave_encashment_detail(request, pk):
    """Retrieve, partially update, or delete a single encashment record."""
    try:
        company = get_client_company(request.user)
        encashment = get_object_or_404(LeaveEncashment, pk=pk, employee__company=company)

        if request.method == 'GET':
            return Response(LeaveEncashmentSerializer(encashment).data)

        elif request.method == 'PATCH':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            serializer = LeaveEncashmentSerializer(encashment, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

        elif request.method == 'DELETE':
            if not is_client_admin(request.user):
                return Response({'error': 'Admin access required'}, status=403)
            if encashment.status not in ['pending', 'rejected']:
                return Response({'error': 'Only pending or rejected encashments can be deleted'}, status=400)
            encashment.delete()
            return Response(status=204)

    except Exception as e:
        import traceback
        logger.error(f"Error in leave_encashment_detail: {str(e)}\n{traceback.format_exc()}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_encashment_process(request, pk):
    """
    Admin action: approve / reject / mark_paid an encashment request.
    POST { action: 'approve' | 'reject' | 'mark_paid', rejection_reason: '...' }
    """
    try:
        if not is_client_admin(request.user):
            return Response({'error': 'Admin access required'}, status=403)

        encashment = get_object_or_404(LeaveEncashment, pk=pk)
        serializer = LeaveEncashmentProcessSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        action_type = serializer.validated_data['action']

        if action_type == 'approve':
            if encashment.status != 'pending':
                return Response({'error': f'Cannot approve a {encashment.status} request'}, status=400)
            approver = getattr(request.user, 'employee_profile', None)
            encashment.approve(approver)
            log_activity(
                user=request.user,
                action_type='APPROVE',
                module='LEAVE',
                description=f"Leave encashment #{encashment.id} approved (₹{encashment.total_amount})",
                reference_id=str(encashment.id)
            )
            return Response({'message': 'Encashment approved successfully', 'total_amount': str(encashment.total_amount)})

        elif action_type == 'reject':
            if encashment.status != 'pending':
                return Response({'error': f'Cannot reject a {encashment.status} request'}, status=400)
            reason = serializer.validated_data.get('rejection_reason', '')
            encashment.reject(reason)  # This also restores leave balance
            log_activity(
                user=request.user,
                action_type='REJECT',
                module='LEAVE',
                description=f"Leave encashment #{encashment.id} rejected",
                reference_id=str(encashment.id),
                new_value={'reason': reason}
            )
            return Response({'message': 'Encashment rejected and leave balance restored'})

        elif action_type == 'mark_paid':
            if encashment.status != 'approved':
                return Response({'error': 'Only approved encashments can be marked as paid'}, status=400)
            encashment.mark_paid()
            log_activity(
                user=request.user,
                action_type='UPDATE',
                module='LEAVE',
                description=f"Leave encashment #{encashment.id} marked as paid (₹{encashment.total_amount})",
                reference_id=str(encashment.id)
            )
            return Response({'message': 'Encashment marked as paid'})

    except Exception as e:
        import traceback
        logger.error(f"Error in leave_encashment_process: {str(e)}\n{traceback.format_exc()}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leave_encashment_eligibility(request):
    """
    Returns encashable leave balances for an employee.
    GET ?employee=<id>&year=<year>
    """
    try:
        employee_id = request.query_params.get('employee')
        year = request.query_params.get('year', date.today().year)
        company = get_client_company(request.user)
        
        # Check if encashment is enabled globally
        settings, _ = LeaveSettings.objects.get_or_create(company=company)
        if not settings.is_encashment_enabled:
             return Response({
                 'employee_id': employee_id, 
                 'daily_rate': 0, 
                 'eligibility': [], 
                 'is_enabled': False,
                 'message': 'Leave encashment is currently disabled by your organization.'
             })

        employee = _get_employee_instance(employee_id, company, request.user)
        
        if not employee:
            return Response({'error': 'Employee record not found'}, status=404)

        # Get balances for encashable leave types
        balances = LeaveBalance.objects.filter(
            employee=employee,
            year=year,
            leave_type__is_encashable=True,
            leave_type__is_active=True
        ).select_related('leave_type')

        daily_rate = _get_employee_daily_rate(employee)

        result = []
        for b in balances:
            available = float(b.available)
            result.append({
                'leave_type_id': b.leave_type.id,
                'leave_type_name': b.leave_type.name,
                'leave_type_code': b.leave_type.code,
                'year': b.year,
                'available_days': available,
                'daily_rate': float(daily_rate),
                'estimated_amount': round(available * float(daily_rate), 2),
            })

        return Response({'employee_id': employee_id, 'daily_rate': float(daily_rate), 'eligibility': result})

    except Exception as e:
        import traceback
        logger.error(f"Error in leave_encashment_eligibility: {str(e)}\n{traceback.format_exc()}")
        return Response({'error': str(e)}, status=500)
