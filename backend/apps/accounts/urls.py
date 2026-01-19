from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

app_name = 'account'

urlpatterns = [
    # ==================== AUTHENTICATION & REGISTRATION ====================
    path('auth/login/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
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
]
