import logging
from django.core.mail import get_connection, EmailMessage
from apps.payroll.models import PayrollSettings

logger = logging.getLogger(__name__)

def send_claim_status_email(claim, status, comments=""):
    """
    Send an email notification to the employee regarding their claim status.
    """
    employee = claim.employee
    company = getattr(employee, 'company', None)
    if not company:
        # Try to find company from PayrollSettings
        settings = PayrollSettings.objects.filter(company__isnull=False).first()
        company = settings.company if settings else None

    if not company:
        logger.warning(f"No company found for employee {employee.email}, skipping email.")
        return

    settings = PayrollSettings.objects.filter(company=company).first()
    if not settings or not settings.email_host:
        logger.warning(f"Email configuration incomplete for {company.name}, skipping email.")
        return

    # Connection Setup
    try:
        connection = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host=settings.email_host,
            port=settings.email_port,
            username=settings.email_host_user,
            password=settings.email_host_password,
            use_tls=settings.email_use_tls,
            timeout=10
        )
    except Exception as e:
        logger.error(f"Failed to connect to SMTP for claim email: {e}")
        return

    subject_map = {
        'approved': f"Expense Claim Approved: {claim.title}",
        'rejected': f"Expense Claim Rejected: {claim.title}",
        'paid': f"Expense Claim Paid: {claim.title}",
        'pending': f"New Expense Claim Submitted: {claim.title}",
    }

    body_map = {
        'approved': f"Dear {employee.username},\n\nYour expense claim '{claim.title}' for INR {claim.amount} has been approved by the Finance team.\n\nBest Regards,\n{company.name} HR",
        'rejected': f"Dear {employee.username},\n\nYour expense claim '{claim.title}' for INR {claim.amount} was not approved.\nReason: {comments}\n\nBest Regards,\n{company.name} HR",
        'paid': f"Dear {employee.username},\n\nPayment for your expense claim '{claim.title}' has been processed. You should see it in your next statement.\n\nBest Regards,\n{company.name} Finance",
    }

    subject = subject_map.get(status, f"Update on your claim: {claim.title}")
    body = body_map.get(status, f"Dear {employee.username},\n\nThere is a status update on your claim '{claim.title}'.\nNew Status: {status}\nComments: {comments}\n\nBest Regards,\n{company.name} HR")

    from_email = settings.email_host_user # Or default_from_email if exists

    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_email,
            to=[employee.email],
            connection=connection
        )
        email.send()
        connection.close()
        logger.info(f"Sent {status} email to {employee.email} for claim {claim.id}")
    except Exception as e:
        logger.error(f"Failed to send claim email to {employee.email}: {e}")


def send_manager_notification_email(claim, stage):
    """
    Notify admin/finance users that a claim has been escalated to Level 2.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    company = getattr(claim.employee, 'company', None)
    if not company:
        from apps.payroll.models import PayrollSettings
        settings_obj = PayrollSettings.objects.filter(company__isnull=False).first()
        company = settings_obj.company if settings_obj else None

    if not company:
        logger.warning("No company found; skipping manager notification.")
        return

    from apps.payroll.models import PayrollSettings
    settings = PayrollSettings.objects.filter(company=company).first()
    if not settings or not settings.email_host:
        logger.warning(f"Email configuration incomplete for {company.name}; skipping manager notification.")
        return

    # Find all staff/admin users within the company
    admin_users = User.objects.filter(is_staff=True, is_active=True).exclude(email='')
    admin_emails = list(admin_users.values_list('email', flat=True))

    if not admin_emails:
        logger.warning("No admin users with emails found; skipping manager notification.")
        return

    try:
        connection = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host=settings.email_host,
            port=settings.email_port,
            username=settings.email_host_user,
            password=settings.email_host_password,
            use_tls=settings.email_use_tls,
            timeout=10
        )
    except Exception as e:
        logger.error(f"Failed to connect to SMTP for manager notification: {e}")
        return

    subject = f"[Action Required] Expense Claim Awaiting Finance Approval: {claim.title}"
    body = (
        f"Dear Finance Team,\n\n"
        f"An expense claim has been approved at Level 1 and is now awaiting your review.\n\n"
        f"  Employee : {claim.employee.get_full_name() or claim.employee.username}\n"
        f"  Claim    : {claim.title}\n"
        f"  Amount   : INR {claim.amount}\n"
        f"  Category : {claim.category.name if claim.category else 'N/A'}\n"
        f"  Date     : {claim.claim_date}\n\n"
        f"Please log in to the HRMS portal and action this claim under Expense Approvals.\n\n"
        f"Best Regards,\n{company.name} HR System"
    )

    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.email_host_user,
            to=admin_emails,
            connection=connection
        )
        email.send()
        connection.close()
        logger.info(f"Sent Level 2 manager notification to {admin_emails} for claim {claim.id}")
    except Exception as e:
        logger.error(f"Failed to send manager notification email: {e}")

