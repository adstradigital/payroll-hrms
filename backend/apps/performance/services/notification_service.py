from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class NotificationService:
    """
    Service for sending notifications related to performance reviews
    """
    
    @staticmethod
    def _send_email(to_email, subject, html_message):
        """
        Helper method to send email
        """
        try:
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            # Log error in production
            print(f"Email sending failed: {str(e)}")
            return False
    
    @staticmethod
    def notify_review_period_started(performance_review):
        """
        Notify employee when a new review period starts
        """
        employee = performance_review.employee
        review_period = performance_review.review_period
        
        subject = f"Performance Review Period Started: {review_period.name}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Performance Review Period Started</h2>
                <p>Dear {employee.get_full_name()},</p>
                <p>A new performance review period has started:</p>
                <ul>
                    <li><strong>Period:</strong> {review_period.name}</li>
                    <li><strong>Review Type:</strong> {review_period.get_review_type_display()}</li>
                    <li><strong>Duration:</strong> {review_period.start_date} to {review_period.end_date}</li>
                    <li><strong>Submission Deadline:</strong> {review_period.submission_deadline}</li>
                </ul>
                <p>Please complete your self-assessment before the deadline.</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        return NotificationService._send_email(employee.email, subject, html_message)
    
    @staticmethod
    def notify_manager_review_pending(performance_review):
        """
        Notify manager when employee submits self-assessment
        """
        manager = performance_review.reviewer or performance_review.employee.manager
        
        if not manager:
            return False
        
        employee = performance_review.employee
        
        subject = f"Review Pending: {employee.get_full_name()}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Employee Self-Assessment Submitted</h2>
                <p>Dear {manager.get_full_name()},</p>
                <p>{employee.get_full_name()} has submitted their self-assessment for {performance_review.review_period.name}.</p>
                <p>Please complete your manager review at your earliest convenience.</p>
                <p><strong>Deadline:</strong> {performance_review.review_period.submission_deadline}</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        return NotificationService._send_email(manager.email, subject, html_message)
    
    @staticmethod
    def notify_employee_review_completed(performance_review):
        """
        Notify employee when manager completes their review
        """
        employee = performance_review.employee
        
        subject = f"Performance Review Completed: {performance_review.review_period.name}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Performance Review Completed</h2>
                <p>Dear {employee.get_full_name()},</p>
                <p>Your manager has completed your performance review for {performance_review.review_period.name}.</p>
                <p><strong>Overall Rating:</strong> {performance_review.overall_rating} - {performance_review.rating_category}</p>
                <p>Please log in to view the complete review and feedback.</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        return NotificationService._send_email(employee.email, subject, html_message)
    
    @staticmethod
    def notify_review_approved(performance_review):
        """
        Notify employee and manager when HR approves the review
        """
        employee = performance_review.employee
        manager = performance_review.reviewer
        
        subject = f"Performance Review Approved: {performance_review.review_period.name}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Performance Review Approved</h2>
                <p>The performance review for {employee.get_full_name()} has been approved by HR.</p>
                <p><strong>Review Period:</strong> {performance_review.review_period.name}</p>
                <p><strong>Final Rating:</strong> {performance_review.overall_rating} - {performance_review.rating_category}</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        # Send to employee
        NotificationService._send_email(employee.email, subject, html_message)
        
        # Send to manager
        if manager:
            NotificationService._send_email(manager.email, subject, html_message)
        
        return True
    
    @staticmethod
    def notify_review_rejected(performance_review, rejection_reason):
        """
        Notify relevant parties when a review is rejected
        """
        employee = performance_review.employee
        manager = performance_review.reviewer
        
        subject = f"Performance Review Requires Revision: {performance_review.review_period.name}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Performance Review Requires Revision</h2>
                <p>The performance review for {employee.get_full_name()} has been sent back for revision.</p>
                <p><strong>Reason:</strong> {rejection_reason}</p>
                <p>Please make the necessary changes and resubmit.</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        # Notify manager
        if manager:
            NotificationService._send_email(manager.email, subject, html_message)
        
        return True
    
    @staticmethod
    def notify_employee_reminder(performance_review):
        """
        Send reminder to employee to complete self-assessment
        """
        employee = performance_review.employee
        review_period = performance_review.review_period
        
        subject = f"Reminder: Complete Your Self-Assessment - {review_period.name}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Performance Review Reminder</h2>
                <p>Dear {employee.get_full_name()},</p>
                <p>This is a reminder to complete your self-assessment for {review_period.name}.</p>
                <p><strong>Deadline:</strong> {review_period.submission_deadline}</p>
                <p>Please complete your self-assessment as soon as possible.</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        return NotificationService._send_email(employee.email, subject, html_message)
    
    @staticmethod
    def notify_manager_reminder(performance_review):
        """
        Send reminder to manager to complete review
        """
        manager = performance_review.reviewer or performance_review.employee.manager
        
        if not manager:
            return False
        
        employee = performance_review.employee
        review_period = performance_review.review_period
        
        subject = f"Reminder: Complete Performance Review - {employee.get_full_name()}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Performance Review Reminder</h2>
                <p>Dear {manager.get_full_name()},</p>
                <p>This is a reminder to complete the performance review for {employee.get_full_name()}.</p>
                <p><strong>Review Period:</strong> {review_period.name}</p>
                <p><strong>Deadline:</strong> {review_period.submission_deadline}</p>
                <p>The employee has already submitted their self-assessment.</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        return NotificationService._send_email(manager.email, subject, html_message)
    
    @staticmethod
    def notify_deadline_approaching(performance_review, days_remaining):
        """
        Notify when deadline is approaching
        """
        employee = performance_review.employee
        review_period = performance_review.review_period
        
        subject = f"Urgent: {days_remaining} Days Left - Performance Review Deadline"
        
        html_message = f"""
        <html>
            <body>
                <h2>Performance Review Deadline Approaching</h2>
                <p>Dear {employee.get_full_name()},</p>
                <p><strong>⚠️ Only {days_remaining} days remaining</strong> to complete your performance review.</p>
                <p><strong>Review Period:</strong> {review_period.name}</p>
                <p><strong>Deadline:</strong> {review_period.submission_deadline}</p>
                <p>Please complete your review immediately to avoid missing the deadline.</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        return NotificationService._send_email(employee.email, subject, html_message)
    
    @staticmethod
    def notify_goal_deadline_approaching(goal, days_remaining):
        """
        Notify employee when goal deadline is approaching
        """
        employee = goal.employee
        
        subject = f"Goal Deadline Approaching: {goal.title}"
        
        html_message = f"""
        <html>
            <body>
                <h2>Goal Deadline Approaching</h2>
                <p>Dear {employee.get_full_name()},</p>
                <p>Your goal "<strong>{goal.title}</strong>" is due in {days_remaining} days.</p>
                <p><strong>Target Date:</strong> {goal.target_date}</p>
                <p><strong>Current Progress:</strong> {goal.progress_percentage}%</p>
                <p>Please update your progress or complete the goal before the deadline.</p>
                <p>Best regards,<br>HR Team</p>
            </body>
        </html>
        """
        
        return NotificationService._send_email(employee.email, subject, html_message)
    
    @staticmethod
    def send_bulk_notification(recipients, subject, message):
        """
        Send bulk notifications to multiple recipients
        """
        success_count = 0
        
        for recipient in recipients:
            if NotificationService._send_email(recipient.email, subject, message):
                success_count += 1
        
        return success_count
