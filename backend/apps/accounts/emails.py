"""
Email Utilities for Nexus HRMS
Handles all email notifications for the platform.
"""

from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_registration_confirmation(admin_email, admin_name, organization_name):
    """
    Send confirmation email when a new organization registration is submitted.
    Informs the registrant that their request is pending approval.
    """
    subject = f"Registration Received - {organization_name}"
    
    plain_message = f"""
Hello {admin_name},

Thank you for registering {organization_name} with Nexus HRMS!

Your registration request has been received and is currently pending approval by our team. 
This process typically takes 24-48 business hours.

What happens next?
1. Our team will review your registration details
2. Once approved, you will receive your login credentials via email
3. You can then access your dashboard and start setting up your organization

If you have any questions, please contact our support team.

Best regards,
The Nexus HRMS Team
    """
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 10px; }}
            .container {{ max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; text-align: center; }}
            .header h1 {{ color: #f59e0b; margin: 0; font-size: 24px; }}
            .content {{ padding: 30px 20px; color: #333; }}
            .content h2 {{ color: #1a1a2e; margin-top: 0; }}
            .status-badge {{ display: inline-block; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 15px 0; }}
            .steps {{ background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .step {{ display: flex; align-items: center; margin: 10px 0; }}
            .step-number {{ background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; flex-shrink: 0; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            
            @media screen and (max-width: 480px) {{
                .header {{ padding: 20px 15px; }}
                .content {{ padding: 20px 15px; }}
                .header h1 {{ font-size: 20px; }}
                .content h2 {{ font-size: 18px; }}
                .step {{ display: block; text-align: left; }}
                .step-number {{ margin-bottom: 8px; }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏢 HRMS PAYROLL</h1>
            </div>
            <div class="content">
                <h2>Welcome, {admin_name}!</h2>
                <p>Thank you for registering <strong>{organization_name}</strong> with HRMS PAYROLL!</p>
                
                <div class="status-badge">⏳ Pending Approval</div>
                
                <p>Your registration request has been received and is currently pending approval by our team. This process typically takes 24-48 business hours.</p>
                
                <div class="steps">
                    <h3 style="margin-top: 0;">What happens next?</h3>
                    <div class="step">
                        <div class="step-number">1</div>
                        <span>Our team will review your registration details</span>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <span>Once approved, you will receive your login credentials via email</span>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <span>You can then access your dashboard and start setting up your organization</span>
                    </div>
                </div>
                
                <p>If you have any questions, please contact our support team.</p>
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
            recipient_list=[admin_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Registration confirmation email sent to {admin_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send registration confirmation email to {admin_email}: {str(e)}")
        return False


def send_login_credentials(admin_email, admin_name, organization_name, username, password, login_url=None):
    """
    Send login credentials email when an organization registration is approved.
    Contains the auto-generated username and password.
    """
    login_url = login_url or "http://localhost:3000/login"
    subject = f"Your Nexus HRMS Account is Ready - {organization_name}"
    
    plain_message = f"""
Hello {admin_name},

Great news! Your organization "{organization_name}" has been approved and your account is now active.

Here are your login credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email/Username: {admin_email}
Temporary Password: {password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login URL: {login_url}

IMPORTANT SECURITY NOTICE:
• Please change your password immediately after your first login
• Do not share these credentials with anyone
• Enable two-factor authentication for enhanced security

If you did not register for this account, please contact our support team immediately.

Welcome to Nexus HRMS!

Best regards,
The Nexus HRMS Team
    """
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 10px; }}
            .container {{ max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; text-align: center; }}
            .header h1 {{ color: #f59e0b; margin: 0; font-size: 24px; }}
            .content {{ padding: 30px 20px; color: #333; }}
            .content h2 {{ color: #1a1a2e; margin-top: 0; }}
            .approved-badge {{ display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 15px 0; }}
            .credentials-box {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 25px 20px; border-radius: 12px; margin: 20px 0; color: white; }}
            .credentials-box h3 {{ color: #f59e0b; margin-top: 0; }}
            .credential-row {{ display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }}
            .credential-row:last-child {{ border-bottom: none; }}
            .credential-label {{ color: #94a3b8; margin-right: 10px; }}
            .credential-value {{ font-family: monospace; font-size: 15px; color: #f59e0b; font-weight: bold; word-break: break-all; }}
            .login-btn {{ display: inline-block; background: #f59e0b; color: #1a1a2e; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
            .warning-box {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 12px; }}

            @media screen and (max-width: 480px) {{
                .header {{ padding: 20px 15px; }}
                .content {{ padding: 20px 15px; }}
                .header h1 {{ font-size: 20px; }}
                .content h2 {{ font-size: 18px; }}
                .credential-row {{ display: block; padding: 8px 0; }}
                .credential-label {{ display: block; margin-bottom: 4px; font-size: 12px; }}
                .credential-value {{ font-size: 14px; }}
                .login-btn {{ width: 100%; box-sizing: border-box; text-align: center; padding: 14px 10px; }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏢 Nexus HRMS</h1>
            </div>
            <div class="content">
                <h2>Welcome aboard, {admin_name}! 🎉</h2>
                <p>Great news! Your organization <strong>"{organization_name}"</strong> has been approved and your account is now active.</p>
                
                <div class="approved-badge">✓ Account Approved</div>
                
                <div class="credentials-box">
                    <h3>🔐 Your Login Credentials</h3>
                    <div class="credential-row">
                        <span class="credential-label">Email / Username:</span>
                        <span class="credential-value">{admin_email}</span>
                    </div>
                    <div class="credential-row">
                        <span class="credential-label">Temporary Password:</span>
                        <span class="credential-value">{password}</span>
                    </div>
                </div>
                
                <center>
                    <a href="{login_url}" class="login-btn">🚀 Login to Dashboard</a>
                </center>
                
                <div class="warning-box">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                        <li>Please change your password immediately after your first login</li>
                        <li>Do not share these credentials with anyone</li>
                        <li>Enable two-factor authentication for enhanced security</li>
                    </ul>
                </div>
                
                <p>If you did not register for this account, please contact our support team immediately.</p>
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
            recipient_list=[admin_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Login credentials email sent to {admin_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send login credentials email to {admin_email}: {str(e)}")
        return False


def send_registration_rejected(admin_email, admin_name, organization_name, rejection_reason=None):
    """
    Send notification email when an organization registration is rejected.
    """
    subject = f"Registration Update - {organization_name}"
    
    reason_text = rejection_reason if rejection_reason else "No specific reason was provided."
    
    plain_message = f"""
Hello {admin_name},

We regret to inform you that your registration request for "{organization_name}" could not be approved at this time.

Reason: {reason_text}

If you believe this was a mistake or would like to provide additional information, please contact our support team.

We appreciate your interest in Nexus HRMS.

Best regards,
The Nexus HRMS Team
    """
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 10px; }}
            .container {{ max-width: 600px; width: 100%; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; text-align: center; }}
            .header h1 {{ color: #f59e0b; margin: 0; font-size: 24px; }}
            .content {{ padding: 30px 20px; color: #333; }}
            .rejected-badge {{ display: inline-block; background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 15px 0; }}
            .reason-box {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }}
            .footer {{ background: #f8fafc; padding: 20px; text-align: center; color: #666; font-size: 12px; }}

            @media screen and (max-width: 480px) {{
                .header {{ padding: 20px 15px; }}
                .content {{ padding: 20px 15px; }}
                .header h1 {{ font-size: 20px; }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏢 Nexus HRMS</h1>
            </div>
            <div class="content">
                <h2>Registration Update</h2>
                <p>Hello {admin_name},</p>
                <p>We regret to inform you that your registration request for <strong>"{organization_name}"</strong> could not be approved at this time.</p>
                
                <div class="rejected-badge">✗ Not Approved</div>
                
                <div class="reason-box">
                    <strong>Reason:</strong>
                    <p style="margin: 10px 0 0 0;">{reason_text}</p>
                </div>
                
                <p>If you believe this was a mistake or would like to provide additional information, please contact our support team.</p>
                <p>We appreciate your interest in Nexus HRMS.</p>
            </div>
            <div class="footer">
                <p>© 2024 Nexus HRMS. All rights reserved.</p>
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
            recipient_list=[admin_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Registration rejection email sent to {admin_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send registration rejection email to {admin_email}: {str(e)}")
        return False
