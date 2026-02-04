from rest_framework import permissions

class IsAdminOrHR(permissions.BasePermission):
    """
    Allows access only to Admin or HR users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']

class IsManagerOrAbove(permissions.BasePermission):
    """
    Allows access to Managers, HR, and Admins.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'hr', 'manager']

class CanManageReviewPeriod(permissions.BasePermission):
    """
    Determines if a user can manage review periods.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']

class CanViewPerformanceReview(permissions.BasePermission):
    """
    Determines if a user can view a performance review.
    """
    def has_object_permission(self, request, obj, view):
        user = request.user
        if user.role in ['admin', 'hr']:
            return True
        if user.role == 'manager' and obj.employee.manager == user:
            return True
        return obj.employee == user

class CanEditPerformanceReview(permissions.BasePermission):
    """
    Determines if a user can edit a performance review.
    """
    def has_object_permission(self, request, obj, view):
        user = request.user
        if user.role in ['admin', 'hr']:
            return True
        if user.role == 'manager' and obj.employee.manager == user:
            return True
        return False

class CanSubmitSelfAssessment(permissions.BasePermission):
    """
    Determines if an employee can submit their own self-assessment.
    """
    def has_object_permission(self, request, obj, view):
        return obj.employee == request.user and obj.status == 'pending'

class CanSubmitManagerReview(permissions.BasePermission):
    """
    Determines if a manager can submit a review for their subordinate.
    """
    def has_object_permission(self, request, obj, view):
        user = request.user
        if user.role in ['admin', 'hr']:
            return True
        return user.role == 'manager' and obj.employee.manager == user and obj.status == 'self_submitted'

class CanManageRatings(permissions.BasePermission):
    """
    Determines if a user can manage rating scales and categories.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']

class CanManageBonusMapping(permissions.BasePermission):
    """
    Determines if a user can manage bonus mappings.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in ['admin', 'hr']

class CanManageGoals(permissions.BasePermission):
    """
    Determines if a user can manage goals.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, obj, view):
        user = request.user
        if user.role in ['admin', 'hr']:
            return True
        if user.role == 'manager' and obj.employee.manager == user:
            return True
        return obj.employee == user
