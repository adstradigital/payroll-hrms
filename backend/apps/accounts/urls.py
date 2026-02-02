from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from apps.requests import views as req_views

app_name = 'account'

urlpatterns = [
    # ==================== AUTHENTICATION & REGISTRATION ====================
    # ==================== AUTHENTICATION & REGISTRATION ====================
    path('auth/login/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/super-admin/login/', views.SuperAdminTokenObtainPairView.as_view(), name='super_admin_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.register_organization, name='register_organization'),
    path('auth/activate/', views.activate_employee, name='activate_employee'),
    
    # ==================== PACKAGES ====================
    path('packages/', views.package_list, name='package_list'),
    path('packages/<uuid:package_id>/', views.package_detail, name='package_detail'),
    
    # ==================== ROLES & PERMISSIONS ====================
    path('roles/', views.role_list_create, name='role_list_create'),
    path('roles/<uuid:pk>/', views.role_detail, name='role_detail'),
    path('permissions/', views.permission_list, name='permission_list'),
    path('scopes/', views.datascope_list, name='datascope_list'),
    
    # ==================== SUBSCRIPTION ====================
    path('subscription/', views.subscription_detail, name='subscription_detail'),
    path('subscription/upgrade/', views.upgrade_subscription, name='upgrade_subscription'),
    path('subscription/cancel/', views.cancel_subscription, name='cancel_subscription'),
    
    # ==================== SUPER ADMIN ====================
    path('users/', views.user_list, name='user_list'),
    
    # ==================== ORGANIZATION REGISTRATION APPROVALS ====================
    path('registrations/submit/', views.submit_organization_registration, name='submit_registration'),
    path('registrations/', views.pending_registrations_list, name='pending_registrations'),
    path('registrations/<uuid:pk>/', views.registration_detail, name='registration_detail'),
    path('registrations/<uuid:pk>/approve/', views.approve_registration, name='approve_registration'),
    path('registrations/<uuid:pk>/reject/', views.reject_registration, name='reject_registration'),

    # ==================== ORGANIZATION ====================
    path('organization/', views.organization_detail, name='organization_detail'),

    
    # ==================== INVITE CODES ====================
    path('invites/', views.invite_list, name='invite_list'),
    path('invites/create/', views.create_invite_code, name='create_invite_code'),
    
    # ==================== COMPANY (Organization) ====================
    path('companies/', views.company_list_create, name='company_list_create'),
    path('companies/<uuid:pk>/', views.company_detail, name='company_detail'),
    path('companies/<uuid:pk>/statistics/', views.company_statistics, name='company_statistics'),
    
    # ==================== DEPARTMENT ====================
    path('departments/', views.department_list_create, name='department_list_create'),
    path('departments/<uuid:pk>/', views.department_detail, name='department_detail'),
    
    # ==================== DESIGNATION ====================
    path('designations/', views.designation_list_create, name='designation_list_create'),
    path('designations/<uuid:pk>/', views.designation_detail, name='designation_detail'),
    path('designations/<uuid:pk>/permissions/', views.designation_permissions, name='designation_permissions'),
    
    # ==================== EMPLOYEE ====================
    path('employees/me/', views.get_my_profile, name='get_my_profile'),
    path('employees/me/permissions/', views.get_my_permissions, name='get_my_permissions'),
    path('employees/', views.employee_list_create, name='employee_list_create'),
    path('employees/<uuid:pk>/', views.employee_detail, name='employee_detail'),
    
    # ==================== EMPLOYEE DOCUMENTS ====================
    path('employees/<uuid:employee_id>/documents/', views.employee_document_list_create, name='employee_document_list_create'),
    path('employees/<uuid:employee_id>/documents/<uuid:pk>/', views.employee_document_detail, name='employee_document_detail'),
    
    # ==================== EMPLOYEE EDUCATION ====================
    path('employees/<uuid:employee_id>/education/', views.employee_education_list_create, name='employee_education_list_create'),
    path('employees/<uuid:employee_id>/education/<uuid:pk>/', views.employee_education_detail, name='employee_education_detail'),
    
    # ==================== EMPLOYEE EXPERIENCE ====================
    path('employees/<uuid:employee_id>/experience/', views.employee_experience_list_create, name='employee_experience_list_create'),
    path('employees/<uuid:employee_id>/experience/<uuid:pk>/', views.employee_experience_detail, name='employee_experience_detail'),

    # ==================== REQUESTS ====================
    path('employees/document-requests/', req_views.DocumentRequestListCreate.as_view(), name='document_request_list'),
    path('employees/document-requests/<uuid:pk>/submit/', req_views.submit_document, name='submit_document'),
    path('employees/document-requests/<uuid:pk>/approve/', req_views.approve_document_request, name='approve_document_request'),
    path('employees/document-requests/<uuid:pk>/reject/', req_views.reject_document_request, name='reject_document_request'),
    path('employees/shift-requests/', req_views.ShiftRequestListCreate.as_view(), name='shift_request_list'),
    path('employees/work-type-requests/', req_views.WorkTypeRequestListCreate.as_view(), name='work_type_request_list'),
    path('employees/reimbursement-requests/', req_views.ReimbursementRequestListCreate.as_view(), name='reimbursement_request_list'),
    path('employees/reimbursement-requests/<uuid:pk>/', req_views.ReimbursementRequestDetail.as_view(), name='reimbursement_request_detail'),
    path('employees/encashment-requests/', req_views.EncashmentRequestListCreate.as_view(), name='encashment_request_list'),
    path('employees/encashment-requests/<uuid:pk>/', req_views.EncashmentRequestDetail.as_view(), name='encashment_request_detail'),
]
