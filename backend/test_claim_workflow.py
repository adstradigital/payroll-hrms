import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '')))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.expenses.models import ExpenseClaim, ExpenseCategory
from apps.expenses.services.workflow_service import ClaimWorkflowService
from django.utils import timezone

User = get_user_model()

def test_workflow():
    print("Starting Claim Workflow Test...")
    
    # 1. Setup Data
    user = User.objects.first()
    if not user:
        print("Error: No user found. Create a user first.")
        return
        
    category, _ = ExpenseCategory.objects.get_or_create(name="Travel", defaults={'description': 'Business travel'})
    
    # 2. Create Claim
    claim = ExpenseClaim.objects.create(
        employee=user,
        title="Bus trip to Mumbai",
        category=category,
        amount=1500.00,
        claim_date=timezone.now().date(),
        description="Traveling for client meet"
    )
    print(f"Created Claim: {claim.id} | Status: {claim.status} | Stage: {claim.current_stage}")

    # 3. Level 1 Approval (Manager)
    print("\nTriggering Level 1 Approval (Manager)...")
    claim = ClaimWorkflowService.transition_claim(claim.id, user, 'approve', "Looks good, proceeds to finance.")
    print(f"Updated Claim: {claim.id} | Status: {claim.status} | Stage: {claim.current_stage}")
    
    # 4. Level 2 Approval (Finance)
    print("\nTriggering Level 2 Approval (Finance)...")
    claim = ClaimWorkflowService.transition_claim(claim.id, user, 'approve', "Finance verified receipts.")
    print(f"Updated Claim: {claim.id} | Status: {claim.status} | Stage: {claim.current_stage}")

    # 5. Final Payment
    print("\nTriggering Final Payment...")
    claim = ClaimWorkflowService.transition_claim(claim.id, user, 'pay', "Payment processed via NEFT.")
    print(f"Updated Claim: {claim.id} | Status: {claim.status} | Stage: {claim.current_stage}")

    print("\nWorkflow History:")
    for entry in claim.approval_history:
        print(f"- {entry['timestamp']}: {entry['action']} at {entry['stage']} | Comments: {entry['comments']}")

if __name__ == "__main__":
    test_workflow()
