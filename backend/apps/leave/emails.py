"""
Email Utilities for Leave Management
Handles leave-related notifications.
"""

from django.core.mail import send_mail
from django.conf import settings
from django.core.signing import TimestampSigner
from django.urls import reverse
import logging

logger = logging.getLogger(__name__)

# Base URL for email links - should ideally be in settings
BASE_URL = getattr(settings, 'SITE_URL', 'http://localhost:8000')

def send_leave_status_email(leave_request, action):
    """
    Send an email to the employee informing them about their leave status.
    action: 'approved' or 'rejected'
    """
    employee = leave_request.employee
    if not employee.email:
        logger.warning(f"No email found for employee {employee.employee_id}")
        return False

    status_color = "#10b981" if action == 'approved' else "#ef4444"
    status_text = action.capitalize()
    
    # Format duration to remove .0 if it's a whole number
    duration = int(leave_request.days_count) if leave_request.days_count % 1 == 0 else leave_request.days_count
    
    subject = f"Leave Request {status_text} - {leave_request.leave_type.name}"
    
    plain_message = f"""
Hello {employee.full_name},

Your leave request for {leave_request.leave_type.name} has been {action}.

Leave Details:
- Start Date: {leave_request.start_date}
- End Date: {leave_request.end_date}
- Duration: {duration} days
- Reason: {leave_request.reason}
"""
    if action == 'rejected' and leave_request.rejection_reason:
        plain_message += f"- Rejection Reason: {leave_request.rejection_reason}\n"
        
    plain_message += "\nBest regards,\nThe HR Team"

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 10px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; text-align: center; }}
            .header h1 {{ color: #f59e0b; margin: 0; font-size: 24px; }}
            .content {{ padding: 30px 20px; color: #333; }}
            .status-badge {{ display: inline-block; background: {status_color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 15px 0; }}
            .details-box {{ background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e293b; }}
            .detail-row {{ margin: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }}
            .detail-label {{ font-weight: 600; color: #64748b; }}
            .detail-value {{ font-weight: 600; color: #1e293b; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏢 HRMS PAYROLL</h1>
            </div>
            <div class="content">
                <h2>Hello {employee.full_name},</h2>
                <p>Your leave request for <strong>{leave_request.leave_type.name}</strong> has been processed.</p>
                
                <div class="status-badge">{status_text}</div>
                
                <div class="details-box">
                    <div class="detail-row">
                        <span class="detail-label">Start Date:</span>
                        <span class="detail-value">{leave_request.start_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">End Date:</span>
                        <span class="detail-value">{leave_request.end_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">{duration} days</span>
                    </div>
                    <div class="detail-row" style="border-bottom: none;">
                        <span class="detail-label">Reason:</span>
                        <span class="detail-value">{leave_request.reason}</span>
                    </div>
                </div>
    """
    
    if action == 'rejected' and leave_request.rejection_reason:
        html_message += f"""
                <div style="background: #fff1f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <strong>Rejection Reason:</strong>
                    <p style="margin: 5px 0 0 0;">{leave_request.rejection_reason}</p>
                </div>
        """
        
    html_message += """
                <p>If you have any questions, please contact the HR department.</p>
                <p>Best regards,<br>The HR Team</p>
            </div>
            <div class="footer">
                <p>© 2024 Nexus HRMS. All rights reserved.</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[employee.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send leave {action} email to {employee.email}: {str(e)}")
        return False


def send_leave_request_to_dept_head(leave_request):
    """
    Notify the department head when a new leave request is submitted.
    Includes interactive Approve and Reject buttons.
    """
    employee = leave_request.employee
    department = employee.department
    
    if not department or not department.head:
        logger.warning(f"No department head found for employee {employee.employee_id}")
        # Fallback to reporting manager if exists
        manager = employee.reporting_manager
        if not manager or not manager.email:
            logger.warning(f"No reporting manager found for employee {employee.employee_id}. Searching for company admins.")
            # Final fallback: Notify ALL company admins (Client Admins)
            from apps.accounts.models import Employee
            admins = Employee.objects.filter(company=employee.company, is_admin=True, status='active')
            if not admins.exists():
                logger.error(f"No manager/dept head/admin found for employee {employee.employee_id}")
                return False
            
            recipient_list = [admin.email for admin in admins if admin.email]
            if not recipient_list:
                logger.error(f"Admins found but no emails for employee {employee.employee_id}")
                return False
            
            # Use the first admin as the friendly name in the greeting
            dept_head = admins.first()
            logger.info(f"Fallback triggered: Notifying {len(recipient_list)} admins: {recipient_list}")
        else:
            dept_head = manager
            recipient_list = [dept_head.email]
    else:
        dept_head = department.head
        recipient_list = [dept_head.email]

    if not recipient_list:
        logger.warning(f"No recipients found for leave request notification.")
        return False

    signer = TimestampSigner()
    
    # Generate tokens for actions
    approve_token = signer.sign(f"{leave_request.pk}:approve")
    reject_token = signer.sign(f"{leave_request.pk}:reject")
    
    # Build absolute URLs
    approve_url = f"{BASE_URL}/api/leave/requests/{leave_request.pk}/email-process/?token={approve_token}&action=approve"
    reject_url = f"{BASE_URL}/api/leave/requests/{leave_request.pk}/email-process/?token={reject_token}&action=reject"
    
    duration = int(leave_request.days_count) if leave_request.days_count % 1 == 0 else leave_request.days_count
    subject = f"New Leave Request: {employee.full_name} ({leave_request.leave_type.name})"

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 10px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px 20px; text-align: center; }}
            .header h1 {{ color: #f59e0b; margin: 0; font-size: 24px; }}
            .content {{ padding: 30px 20px; color: #333; }}
            .employee-card {{ background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }}
            .details-box {{ background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }}
            .detail-row {{ margin: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding-bottom: 4px; }}
            .detail-label {{ font-weight: 600; color: #64748b; font-size: 14px; }}
            .detail-value {{ font-weight: 600; color: #1e293b; font-size: 14px; }}
            .actions {{ display: flex; justify-content: center; gap: 20px; margin-top: 30px; }}
            .btn {{ text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; color: white; display: inline-block; transition: opacity 0.2s; }}
            .btn-approve {{ background-color: #10b981; }}
            .btn-reject {{ background-color: #ef4444; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏢 Leave Request Review</h1>
            </div>
            <div class="content">
                <h2>Hello {dept_head.full_name},</h2>
                <p>A new leave request has been submitted by an employee in your department.</p>
                
                <div class="employee-card">
                    <strong>{employee.full_name}</strong><br>
                    <span style="color: #64748b; font-size: 12px;">Employee ID: {employee.employee_id}</span>
                </div>
                
                <div class="details-box">
                    <div class="detail-row">
                        <span class="detail-label">Leave Type:</span>
                        <span class="detail-value">{leave_request.leave_type.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">{duration} days</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dates:</span>
                        <span class="detail-value">{leave_request.start_date} to {leave_request.end_date}</span>
                    </div>
                    <div class="detail-row" style="border-bottom: none;">
                        <span class="detail-label">Reason:</span>
                        <span class="detail-value">{leave_request.reason}</span>
                    </div>
                </div>

                <p style="text-align: center; font-weight: 600; color: #1e293b;">Would you like to approve or reject this request?</p>
                
                <div class="actions">
                    <a href="{approve_url}" class="btn btn-approve">APPROVE</a>
                    <a href="{reject_url}" class="btn btn-reject">REJECT</a>
                </div>
                
                <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #64748b;">
                    Clicking a button will process the request immediately.
                </p>
            </div>
            <div class="footer">
                <p>© 2024 Nexus HRMS. All rights reserved.</p>
                <p>This is an automated system notification.</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        send_mail(
            subject=subject,
            message=f"New leave request from {employee.full_name}. Please check the system to review.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Leave request notification sent to: {recipient_list}")
        return True
    except Exception as e:
        logger.error(f"Failed to send leave request notification: {str(e)}")
        return False
