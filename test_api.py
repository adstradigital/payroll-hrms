
import os
import django
import sys

# Setup Django environment
sys.path.append('c:\\Users\\misha\\Desktop\\payroll-hrms\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User, Employee
from apps.payroll.models import SalaryComponent, TaxSlab, TaxDeclaration, PayrollSettings, EmployeeSalaryComponent
from django.db.models import Sum, Count

def test_api_logic():
    try:
        user = User.objects.first()
        if not user:
            print("No users found")
            return
            
        print(f"Testing for user: {user.username}")
        
        # Mock get_client_company
        company = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            company = user.employee_profile.company
        elif hasattr(user, 'organization') and user.organization:
            company = user.organization
        
        if not company:
            print("No company found for user")
            # Try to get first company/org anyway
            from apps.accounts.models import Organization
            company = Organization.objects.first()
            print(f"Using fallback company: {company}")

        # 1. Test tax_dashboard_stats logic
        print("Testing tax_dashboard_stats logic...")
        tds_component_ids = SalaryComponent.objects.filter(company=company, statutory_type='tds').values_list('id', flat=True)
        total_tds_monthly = EmployeeSalaryComponent.objects.filter(employee_salary__employee__company=company, employee_salary__is_current=True, component_id__in=tds_component_ids).aggregate(total=Sum('amount'))['total'] or 0
        pending_count = TaxDeclaration.objects.filter(employee__company=company, status='pending').count()
        regime_counts = TaxDeclaration.objects.filter(employee__company=company).values('regime').annotate(count=Count('id'))
        
        print(f"Stats: TDS Monthly: {total_tds_monthly}, Pending: {pending_count}, Regimes: {list(regime_counts)}")

        # 2. Test payroll_settings_detail logic
        print("Testing payroll_settings_detail logic...")
        settings, created = PayrollSettings.objects.get_or_create(company=company)
        print(f"Settings: {settings}, Created: {created}")

        # 3. Test tax_slab_list logic
        print("Testing tax_slab_list logic...")
        slabs = TaxSlab.objects.filter(company=company).order_by('min_income')
        print(f"Slabs count: {slabs.count()}")

        # 4. Test tax_declaration_list logic
        print("Testing tax_declaration_list logic...")
        decls = TaxDeclaration.objects.filter(employee__company=company).count()
        print(f"Declarations count: {decls}")

        print("All internal logic tests passed!")

    except Exception as e:
        print(f"Internal logic error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_logic()
