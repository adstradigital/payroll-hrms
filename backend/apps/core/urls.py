from django.urls import path
from .views import (
    CompanyListCreateView, CompanyDetailView,
    DepartmentListCreateView,
    DesignationListCreateView,
    EmployeeListCreateView, EmployeeDetailView
)

urlpatterns = [
    path('companies/', CompanyListCreateView.as_view()),
    path('companies/<int:pk>/', CompanyDetailView.as_view()),

    path('departments/', DepartmentListCreateView.as_view()),
    path('designations/', DesignationListCreateView.as_view()),

    path('employees/', EmployeeListCreateView.as_view()),
    path('employees/<int:pk>/', EmployeeDetailView.as_view()),
]
