# Backend Development Guidelines

## Project Structure

```
backend/
├── manage.py
├── config/                           # PROJECT SETTINGS
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── apps/
│   ├── accounts/                     # USER & ORGANIZATION MODULE
│   │   ├── models.py                 # Organization, Employee, Department, etc.
│   │   ├── serializers.py            # List/Detail serializer pairs
│   │   ├── views.py                  # Function-based views
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests.py
│   │
│   ├── subscriptions/                # SUBSCRIPTION & BILLING MODULE
│   │   ├── models.py                 # Package, Subscription, Payment
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests.py
│   │
│   ├── attendance/                   # ATTENDANCE MODULE
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── leave/                        # LEAVE MODULE
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── payroll/                      # PAYROLL MODULE
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   └── core/                         # SHARED UTILITIES
│       ├── permissions.py            # Custom permission classes
│       ├── pagination.py             # Custom pagination classes
│       ├── mixins.py                 # Reusable view mixins
│       └── utils.py                  # Helper functions
│
└── media/                            # User uploaded files
    ├── employees/
    ├── organizations/
    └── documents/
```

---

## Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Backend Apps                         │
├─────────────────────────────────────────────────────────────┤
│  accounts/               │  subscriptions/                  │
│  ├── Organization        │  ├── Package                     │
│  ├── Company (proxy)     │  ├── Subscription                │
│  ├── Department          │  ├── Payment                     │
│  ├── Designation         │  └── FeatureUsage                │
│  ├── Employee            │                                  │
│  ├── InviteCode          │                                  │
│  └── NotificationPref    │                                  │
├─────────────────────────────────────────────────────────────┤
│  attendance/             │  leave/                          │
│  ├── AttendanceRecord    │  ├── LeaveType                   │
│  ├── Shift               │  ├── LeaveBalance                │
│  └── Holiday             │  └── LeaveRequest                │
├─────────────────────────────────────────────────────────────┤
│  payroll/                │  core/                           │
│  ├── SalaryStructure     │  ├── Permissions                 │
│  ├── PayrollRun          │  ├── Pagination                  │
│  ├── PaySlip             │  └── Utils                       │
│  └── TaxSettings         │                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Coding Standards

### Model Rules
- ✅ UUID primary keys for all models
- ✅ Inherit from `BaseModel` for audit fields
- ✅ Add database indexes for frequently queried fields
- ✅ Use `related_name` on all ForeignKey/OneToOne fields
- ❌ No auto-incrementing integer PKs for main models
- ❌ No nullable fields without explicit `null=True, blank=True`

### Model Example
```python
# ✅ Correct
class Employee(BaseModel):
    """Employee Model with comprehensive fields"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='employees'
    )
    email = models.EmailField(unique=True, db_index=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        db_index=True
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['company', 'status']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"

# ❌ Wrong
class Employee(models.Model):
    id = models.AutoField(primary_key=True)  # Use UUID instead
    company = models.ForeignKey(Organization, on_delete=models.CASCADE)  # Missing related_name
```

---

## View Pattern (Function-Based with Try-Except)

### Structure
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def resource_list_create(request):
    """
    GET: List all resources with filters
    POST: Create a new resource
    """
    try:
        if request.method == 'GET':
            # Get query parameters
            search = request.query_params.get('search', None)
            is_active = request.query_params.get('is_active', None)
            
            # Build queryset with select_related for optimization
            queryset = Resource.objects.select_related('related_model')
            
            # Apply filters
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(code__icontains=search)
                )
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            # Pagination
            paginator = StandardResultsSetPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            
            serializer = ResourceListSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        elif request.method == 'POST':
            serializer = ResourceDetailSerializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                logger.info(f"Resource created: {serializer.data['name']} by {request.user.username}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error in resource_list_create: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def resource_detail(request, pk):
    """
    GET: Retrieve resource details
    PUT/PATCH: Update resource
    DELETE: Delete resource
    """
    try:
        resource = get_object_or_404(Resource, pk=pk)
        
        if request.method == 'GET':
            serializer = ResourceDetailSerializer(resource)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = ResourceDetailSerializer(
                resource, 
                data=request.data, 
                partial=partial
            )
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                logger.info(f"Resource updated: {resource.name} by {request.user.username}")
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            resource_name = resource.name
            resource.delete()
            logger.info(f"Resource deleted: {resource_name} by {request.user.username}")
            return Response(
                {'message': 'Resource deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
    
    except Exception as e:
        logger.error(f"Error in resource_detail: {str(e)}")
        return Response(
            {'error': 'An error occurred while processing your request.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## Serializer Pattern

### Structure
```python
from rest_framework import serializers

# ✅ ALWAYS create List and Detail serializer pairs
class ResourceListSerializer(serializers.ModelSerializer):
    """Minimal fields for list views"""
    related_name = serializers.CharField(source='related.name', read_only=True)
    computed_field = serializers.SerializerMethodField()
    
    class Meta:
        model = Resource
        fields = ['id', 'name', 'code', 'is_active', 'related_name', 'computed_field']
        read_only_fields = ['id']
    
    def get_computed_field(self, obj):
        return obj.some_calculation()


class ResourceDetailSerializer(serializers.ModelSerializer):
    """All fields for detail/create/update views"""
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Resource
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']
```

---

## URL Pattern

### Structure
```python
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Resource CRUD
    path('resources/', views.resource_list_create, name='resource-list-create'),
    path('resources/<uuid:pk>/', views.resource_detail, name='resource-detail'),
    
    # Nested resources
    path('resources/<uuid:resource_id>/items/', views.item_list_create, name='item-list-create'),
    path('resources/<uuid:resource_id>/items/<uuid:pk>/', views.item_detail, name='item-detail'),
    
    # Custom actions
    path('resources/<uuid:pk>/activate/', views.resource_activate, name='resource-activate'),
    path('resources/statistics/', views.resource_statistics, name='resource-statistics'),
]
```

---

## Error Handling Best Practices

| Pattern | Usage |
|---------|-------|
| `get_object_or_404()` | Fetching single objects - auto returns 404 |
| `try-except` wrapper | All view functions - catches unexpected errors |
| `serializer.is_valid()` | Data validation - returns 400 on failure |
| `logger.error()` | Log all errors with context |
| `logger.info()` | Log successful create/update/delete operations |

### Response Codes
```python
# ✅ Use correct HTTP status codes
status.HTTP_200_OK          # GET success, PUT/PATCH success
status.HTTP_201_CREATED     # POST success (created)
status.HTTP_204_NO_CONTENT  # DELETE success
status.HTTP_400_BAD_REQUEST # Validation errors
status.HTTP_401_UNAUTHORIZED # Not authenticated
status.HTTP_403_FORBIDDEN   # No permission
status.HTTP_404_NOT_FOUND   # Resource not found
status.HTTP_500_INTERNAL_SERVER_ERROR # Unexpected errors
```

---

## Database Query Optimization

```python
# ✅ Use select_related for ForeignKey/OneToOne
queryset = Employee.objects.select_related(
    'company', 'department', 'designation', 'reporting_manager'
)

# ✅ Use prefetch_related for reverse ForeignKey/ManyToMany
queryset = Company.objects.prefetch_related(
    'employees', 'departments'
)

# ✅ Use only() to limit fields
queryset = Employee.objects.only('id', 'first_name', 'email')

# ✅ Use values() for dictionaries
queryset = Employee.objects.values('id', 'first_name')

# ✅ Use annotate for aggregations
from django.db.models import Count
queryset = Company.objects.annotate(employee_count=Count('employees'))
```

---

## Pagination

```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# Usage in views
paginator = StandardResultsSetPagination()
paginated_queryset = paginator.paginate_queryset(queryset, request)
serializer = ResourceListSerializer(paginated_queryset, many=True)
return paginator.get_paginated_response(serializer.data)
```

---

## Permissions

```python
# ✅ Always use permission_classes decorator
from rest_framework.permissions import IsAuthenticated, IsAdminUser

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    pass

# ✅ Custom permissions in core/permissions.py
from rest_framework.permissions import BasePermission

class IsOrganizationAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'employee_profile') and \
               request.user.employee_profile.designation.is_managerial
```

---

## Checklist Before Commit

- [ ] All views wrapped in `try-except`
- [ ] Using `get_object_or_404` for detail views
- [ ] Logging for create/update/delete operations
- [ ] `select_related`/`prefetch_related` for related models
- [ ] List and Detail serializer pairs
- [ ] UUID primary keys on models
- [ ] Database indexes on filtered fields
- [ ] Proper HTTP status codes
- [ ] Pagination for list views
- [ ] Permission classes on all views
