from rest_framework import permissions


class IsAdminOrHR(permissions.BasePermission):
    """
    Only Admin or HR can access
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']


class IsManagerOrAbove(permissions.BasePermission):
    """
    Manager, HR, or Admin can access
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'hr', 'manager']


class CanManageReviewPeriod(permissions.BasePermission):
    """
    Only Admin/HR can create or modify review periods
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']


class CanViewPerformanceReview(permissions.BasePermission):
    """
    - Admin/HR: Can view all reviews
    - Manager: Can view their team's reviews
    - Employee: Can view only their own review
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admin/HR can view all
        if user.role in ['admin', 'hr']:
            return True
        
        # Manager can view their team's reviews
        if user.role == 'manager' and hasattr(obj.employee, 'manager'):
            if obj.employee.manager == user:
                return True
        
        # Employee can view their own
        if obj.employee == user:
            return True
        
        return False


class CanEditPerformanceReview(permissions.BasePermission):
    """
    - Admin/HR: Can edit all reviews
    - Manager: Can edit their team's reviews (manager sections only)
    - Employee: Can edit their own review (self-assessment only)
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admin/HR can edit all
        if user.role in ['admin', 'hr']:
            return True
        
        # Manager can edit their team's reviews
        if user.role == 'manager' and hasattr(obj.employee, 'manager'):
            if obj.employee.manager == user:
                return True
        
        # Employee can only submit self-assessment
        if obj.employee == user and obj.status == 'pending':
            return True
        
        return False


class CanSubmitSelfAssessment(permissions.BasePermission):
    """
    Only the employee can submit their self-assessment
    """
    def has_object_permission(self, request, view, obj):
        return (request.user.is_authenticated and 
                obj.employee == request.user and 
                obj.status in ['pending', 'rejected'])


class CanSubmitManagerReview(permissions.BasePermission):
    """
    Only the assigned reviewer (manager) or Admin/HR can submit manager review
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role in ['admin', 'hr']:
            return True
        
        if obj.reviewer == user or (hasattr(obj.employee, 'manager') and obj.employee.manager == user):
            return True
        
        return False


class CanManageRatings(permissions.BasePermission):
    """
    Only Admin/HR can configure rating scales and categories
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']


class CanManageBonusMapping(permissions.BasePermission):
    """
    Only Admin/HR can configure bonus mappings
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            # Managers can view bonus rules (read-only)
            return request.user.is_authenticated and request.user.role in ['admin', 'hr', 'manager']
        # Only Admin/HR can create/edit
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']


class CanViewOwnBonusOnly(permissions.BasePermission):
    """
    Employees can only view their own bonus information
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role in ['admin', 'hr']:
            return True
        
        # If this is bonus data related to a specific employee
        if hasattr(obj, 'employee'):
            return obj.employee == user
        
        return False


class CanManageGoals(permissions.BasePermission):
    """
    - Admin/HR: Can manage all goals
    - Manager: Can manage their team's goals
    - Employee: Can manage their own goals
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role in ['admin', 'hr']:
            return True
        
        if user.role == 'manager' and hasattr(obj.employee, 'manager'):
            if obj.employee.manager == user:
                return True
        
        if obj.employee == user:
            return True
        
        return False
