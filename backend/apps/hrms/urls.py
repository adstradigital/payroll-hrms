from django.urls import path

from . import views

urlpatterns = [
    path('employee-fields/', views.employee_custom_field_list_create, name='employee-custom-field-list-create'),
    path('employee-fields/<uuid:pk>/', views.employee_custom_field_detail, name='employee-custom-field-detail'),
    path('document-types/', views.employee_document_type_list_create, name='employee-document-type-list-create'),
    path('document-types/<uuid:pk>/', views.employee_document_type_detail, name='employee-document-type-detail'),
    path('onboarding-templates/', views.onboarding_template_list_create, name='onboarding-template-list-create'),
    path('onboarding-templates/<uuid:pk>/', views.onboarding_template_detail, name='onboarding-template-detail'),
    path('onboarding-steps/<uuid:template_id>/', views.onboarding_steps_by_template, name='onboarding-step-list'),
    path('onboarding-steps/', views.onboarding_step_create, name='onboarding-step-create'),
    path('employee-onboarding/<uuid:employee_id>/', views.employee_onboarding_steps, name='employee-onboarding-steps'),
    path('employee-onboarding-step/<uuid:pk>/', views.update_employee_onboarding_step, name='update-employee-onboarding-step'),
    path('backup/', views.settings_backup, name='settings-backup'),
    path('backup/download/', views.settings_backup_download, name='settings-backup-download'),
]
