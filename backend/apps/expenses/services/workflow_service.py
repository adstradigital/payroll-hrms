import logging
from django.utils import timezone
from decimal import Decimal
from ..models import ExpenseClaim

logger = logging.getLogger(__name__)

class ClaimWorkflowService:
    """
    Service for managing multi-stage approval workflow for Expense Claims:
    Level 1: Manager Approval
    Level 2: Finance Approval
    Status: Paid (Final)
    """

    @staticmethod
    def transition_claim(claim_id, user, action, comments=""):
        """
        Transition a claim to the next stage or reject it.
        Actions: 'approve', 'reject', 'pay'
        """
        try:
            claim = ExpenseClaim.objects.get(pk=claim_id)
            old_status = claim.status
            old_stage = claim.current_stage

            history_entry = {
                'user': str(user),
                'user_id': user.id,
                'action': action,
                'stage': old_stage,
                'comments': comments,
                'timestamp': timezone.now().isoformat()
            }

            if action == 'reject':
                claim.status = 'rejected'
                claim.approval_history.append(history_entry)
                claim.save()
                # Trigger Notification
                ClaimWorkflowService.notify_employee(claim, 'rejected', comments)
                return claim

            if claim.current_stage == 'level1':
                if action == 'approve':
                    claim.current_stage = 'level2'
                    claim.status = 'pending' # Still pending final finance approval
                    claim.approval_history.append(history_entry)
                    claim.save()
                    ClaimWorkflowService.notify_manager(claim, stage='level2')
                
            elif claim.current_stage == 'level2':
                if action == 'approve':
                    claim.current_stage = 'completed'
                    claim.status = 'approved'
                    claim.approved_by = user
                    claim.approval_history.append(history_entry)
                    claim.save()
                    ClaimWorkflowService.notify_employee(claim, 'approved')
                
            elif claim.status == 'approved' and action == 'pay':
                claim.status = 'paid'
                claim.approval_history.append(history_entry)
                claim.save()
                ClaimWorkflowService.notify_employee(claim, 'paid')

            return claim

        except ExpenseClaim.DoesNotExist:
            logger.error(f"Claim {claim_id} not found")
            raise Exception("Claim not found")
        except Exception as e:
            logger.error(f"Workflow transition error: {str(e)}")
            raise

    @staticmethod
    def notify_employee(claim, status, comments=""):
        """Mock notification trigger - Will link to email service later"""
        from ..emails import send_claim_status_email
        try:
            send_claim_status_email(claim, status, comments)
        except Exception as e:
            logger.error(f"Failed to send employee notification: {e}")

    @staticmethod
    def notify_manager(claim, stage):
        """Mock notification for next approver"""
        # In a real system, we'd lookup the Finance team or Dept Manager
        pass
