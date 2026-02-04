from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal


def validate_review_period_dates(start_date, end_date, submission_deadline=None):
    """
    Validate review period dates
    """
    if end_date <= start_date:
        raise ValidationError("End date must be after start date")
    
    if submission_deadline and submission_deadline < end_date:
        raise ValidationError("Submission deadline should be on or after end date")
    
    return True


def validate_rating_value(rating, min_value=0, max_value=5):
    """
    Validate rating is within acceptable range
    """
    if rating is None:
        return True
    
    rating = Decimal(str(rating))
    
    if rating < min_value or rating > max_value:
        raise ValidationError(f"Rating must be between {min_value} and {max_value}")
    
    return True


def validate_weightage_total(criteria_list, expected_total=100):
    """
    Validate that total weightage of all criteria equals expected total
    """
    total = sum(float(c.get('weightage', 0)) for c in criteria_list)
    
    if abs(total - expected_total) > 0.01:  # Allow small floating point differences
        raise ValidationError(f"Total weightage must equal {expected_total}%. Current total: {total}%")
    
    return True


def validate_bonus_mapping_overlap(rating_scale, min_rating, max_rating, applies_to_level=None, 
                                   exclude_id=None):
    """
    Validate that bonus mappings don't overlap for the same rating scale and level
    """
    from .models import BonusMapping
    
    queryset = BonusMapping.objects.filter(
        rating_scale=rating_scale,
        is_active=True
    )
    
    if applies_to_level:
        queryset = queryset.filter(applies_to_level=applies_to_level)
    
    if exclude_id:
        queryset = queryset.exclude(id=exclude_id)
    
    # Check for overlaps
    for mapping in queryset:
        if not (max_rating <= mapping.min_rating or min_rating >= mapping.max_rating):
            raise ValidationError(
                f"Bonus mapping overlaps with existing mapping: "
                f"{mapping.min_rating}-{mapping.max_rating}"
            )
    
    return True


def validate_review_can_be_submitted(performance_review):
    """
    Validate that a review can be submitted (not past deadline, etc.)
    """
    if performance_review.review_period.status != 'active':
        raise ValidationError("Cannot submit review for inactive review period")
    
    if timezone.now().date() > performance_review.review_period.submission_deadline:
        raise ValidationError("Submission deadline has passed")
    
    return True


def validate_self_assessment_complete(performance_review):
    """
    Validate that self-assessment is complete before manager can review
    """
    if performance_review.status not in ['self_submitted', 'under_review']:
        raise ValidationError("Employee must submit self-assessment first")
    
    if not performance_review.self_assessment:
        raise ValidationError("Self-assessment cannot be empty")
    
    return True


def validate_manager_review_complete(performance_review):
    """
    Validate that manager review is complete before marking as completed
    """
    required_fields = [
        'manager_feedback',
        'manager_rating',
        'overall_rating',
        'rating_category'
    ]
    
    for field in required_fields:
        if not getattr(performance_review, field):
            raise ValidationError(f"{field.replace('_', ' ').title()} is required")
    
    return True


def validate_goal_dates(target_date, review_period):
    """
    Validate that goal target date is within review period
    """
    if target_date < review_period.start_date:
        raise ValidationError("Goal target date cannot be before review period start date")
    
    if target_date > review_period.end_date:
        raise ValidationError("Goal target date cannot be after review period end date")
    
    return True


def validate_progress_percentage(progress):
    """
    Validate progress percentage is between 0 and 100
    """
    if progress < 0 or progress > 100:
        raise ValidationError("Progress percentage must be between 0 and 100")
    
    return True


def validate_user_can_review(reviewer, employee):
    """
    Validate that reviewer is authorized to review the employee
    """
    # Check if reviewer is the employee's manager
    if hasattr(employee, 'manager') and employee.manager == reviewer:
        return True
    
    # Check if reviewer is Admin/HR
    if reviewer.role in ['admin', 'hr']:
        return True
    
    raise ValidationError("You are not authorized to review this employee")


def validate_rating_category_ranges(rating_scale, categories):
    """
    Validate that rating categories cover the entire scale range without gaps or overlaps
    """
    if not categories:
        raise ValidationError("At least one rating category is required")
    
    # Sort by min_score
    sorted_categories = sorted(categories, key=lambda x: x['min_score'])
    
    # Check first category starts at scale minimum
    if sorted_categories[0]['min_score'] != rating_scale.min_value:
        raise ValidationError(
            f"First category must start at {rating_scale.min_value}"
        )
    
    # Check last category ends at scale maximum
    if sorted_categories[-1]['max_score'] != rating_scale.max_value:
        raise ValidationError(
            f"Last category must end at {rating_scale.max_value}"
        )
    
    # Check for gaps and overlaps
    for i in range(len(sorted_categories) - 1):
        current = sorted_categories[i]
        next_cat = sorted_categories[i + 1]
        
        if current['max_score'] > next_cat['min_score']:
            raise ValidationError(
                f"Categories overlap: {current['name']} and {next_cat['name']}"
            )
        
        if current['max_score'] < next_cat['min_score']:
            raise ValidationError(
                f"Gap between categories: {current['name']} and {next_cat['name']}"
            )
    
    return True
