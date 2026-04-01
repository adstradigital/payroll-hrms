from django.urls import path
from . import views

urlpatterns = [
    path('submit/', views.SubmitExpenseClaim.as_view(), name='submit_claim'),
    path('my-claims/', views.MyClaimsList.as_view(), name='my_claims'),
    path('categories/', views.CategoryListCreate.as_view(), name='categories_list'),
    path('categories/<int:pk>/', views.CategoryRetrieveUpdateDestroy.as_view(), name='category_detail'),
    path('approvals/', views.PendingApprovals.as_view(), name='pending_approvals'),
    path('approve/<int:pk>/', views.ApproveClaim.as_view(), name='approve_claim'),
    path('reject/<int:pk>/', views.RejectClaim.as_view(), name='reject_claim'),
]

