# Attendance Request Integration - Backend & Frontend

## Overview
This document explains how the Attendance Request feature is integrated between the backend Django API and the React frontend.

---

## Backend Integration

### 1. Database Model
**Location**: `backend/apps/attendance/models.py`

```python
class AttendanceRegularizationRequest(models.Model):
    """Requests to regularize attendance"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )
    
    # Key Fields:
    - id: UUID primary key
    - employee: ForeignKey to Employee
    - attendance: ForeignKey to Attendance
    - request_type: Choice field (missed_checkin, missed_checkout, late_arrival, etc.)
    - requested_check_in: DateTime (optional)
    - requested_check_out: DateTime (optional)
    - reason: Text field
    - supporting_document: File field (optional)
    - status: Status of the request (pending, approved, rejected)
    - reviewed_by: ForeignKey to Employee (reviewer)
    - reviewed_at: DateTime
    - reviewer_comments: Text
    - created_at: Auto timestamp
    - updated_at: Auto timestamp
```

### 2. Serializer
**Location**: `backend/apps/attendance/serializers.py`

```python
class AttendanceRegularizationRequestSerializer(serializers.ModelSerializer):
    """Attendance Regularization Request Serializer"""
    - Provides read-only fields for employee, attendance, and reviewer names
    - Validates that check-out time is after check-in time
    - Includes full data for API responses
```

### 3. ViewSet & API Endpoints
**Location**: `backend/apps/attendance/views.py`

```python
class AttendanceRegularizationRequestViewSet(viewsets.ModelViewSet):
    
    Endpoints Available:
    - GET    /attendance/regularization/              # List all requests
    - POST   /attendance/regularization/              # Create new request
    - GET    /attendance/regularization/{id}/         # Retrieve single request
    - PUT    /attendance/regularization/{id}/         # Update request
    - DELETE /attendance/regularization/{id}/         # Delete request
    - GET    /attendance/regularization/pending/      # Get pending requests
    - POST   /attendance/regularization/{id}/approve/ # Approve request
    - POST   /attendance/regularization/{id}/reject/  # Reject request
    
    Features:
    - Filtering by status, request_type, employee
    - Search by employee name/ID, reason
    - Ordering by created_at, status
    - Permission: IsAuthenticated
```

### 4. URL Configuration
**Location**: `backend/apps/attendance/urls.py`

All endpoints are prefixed with `/attendance/`

---

## Frontend Integration

### 1. API Service
**Location**: `frontend/api/attendance_api.js`

Provides a clean interface to backend endpoints:

```javascript
attendanceApi.getRegularizationRequests(params)  // Get all requests
attendanceApi.getPendingRequests()                // Get pending requests
attendanceApi.getRegularizationRequest(id)        // Get single request
attendanceApi.createRegularizationRequest(data)   // Create new request
attendanceApi.updateRegularizationRequest(id, data) // Update request
attendanceApi.deleteRegularizationRequest(id)     // Delete request
attendanceApi.approveRequest(id, data)            // Approve request
attendanceApi.rejectRequest(id, data)             // Reject request
```

### 2. React Component
**Location**: `frontend/components/ClientAdmin/Account/Attendance/AttendanceRequests/AttendanceRequests.js`

#### Features:
- **List Display**: Shows all regularization requests in a table
- **Filtering**: Filter by status (All, Pending, Approved, Rejected)
- **Search**: Search by employee name or ID
- **Bulk Actions**: Select multiple requests and approve/reject in bulk
- **Create Request**: Modal form to create new regularization requests
- **Individual Actions**: Approve/Reject single requests with status update
- **Error Handling**: Display error messages for failed operations
- **Loading States**: Show spinners while loading/submitting
- **Status Badges**: Visual indicators for request status

#### Component State:
```javascript
- requests: Array of regularization requests
- loading: Boolean for loading state
- error: Error message string
- activeTab: Current filter tab
- search: Search query
- selected: Array of selected request IDs
- showModal: Boolean for modal visibility
- submitting: Boolean for submission state
```

### 3. CSS Styling
**Location**: `frontend/components/ClientAdmin/Account/Attendance/AttendanceRequests/AttendanceRequests.css`

Provides complete styling for:
- Tables with hover effects
- Modals and forms
- Status badges
- Loading and error states
- Responsive design for mobile
- Smooth animations and transitions

---

## Data Flow

### 1. Creating a New Request
```
User fills form → Component state updated → POST /attendance/regularization/ 
→ Backend creates AttendanceRegularizationRequest 
→ Response with new request data 
→ Frontend adds to requests list
```

**Form Fields Required:**
- Employee ID (required)
- Request Type (full_day, missed_checkin, missed_checkout, late_arrival, early_departure)
- Attendance Date (required)
- Check-In Time (optional)
- Check-Out Time (optional)
- Reason (optional)

### 2. Approving a Request
```
User clicks Approve → POST /attendance/regularization/{id}/approve/ 
→ Backend updates status to 'approved' 
→ Updates attendance check-in/out times if provided
→ Response with updated request 
→ Frontend updates local state
```

### 3. Rejecting a Request
```
User clicks Reject → POST /attendance/regularization/{id}/reject/ 
→ Backend updates status to 'rejected' 
→ Stores reviewer comments 
→ Response with updated request 
→ Frontend updates local state
```

### 4. Fetching Requests
```
Component mounts → GET /attendance/regularization/ 
→ Backend returns all regularization requests 
→ Frontend stores in state 
→ Displays in table with filters applied
```

---

## Request/Response Examples

### Create Request
```javascript
// Request
POST /attendance/regularization/
{
  "employee": "employee-uuid",
  "attendance": "attendance-uuid",
  "request_type": "missed_checkin",
  "requested_check_in": "2026-01-22T09:00:00Z",
  "requested_check_out": null,
  "reason": "System was down"
}

// Response (201 Created)
{
  "id": "request-uuid",
  "employee": "employee-uuid",
  "employee_name": "John Doe",
  "employee_id": "EMP001",
  "attendance": "attendance-uuid",
  "attendance_date": "2026-01-22",
  "request_type": "missed_checkin",
  "requested_check_in": "2026-01-22T09:00:00Z",
  "requested_check_out": null,
  "reason": "System was down",
  "status": "pending",
  "reviewed_by": null,
  "reviewed_by_name": "",
  "reviewed_at": null,
  "reviewer_comments": "",
  "created_at": "2026-01-22T10:30:00Z",
  "updated_at": "2026-01-22T10:30:00Z"
}
```

### List Requests
```javascript
// Request
GET /attendance/regularization/?status=pending

// Response
{
  "count": 5,
  "results": [
    {
      "id": "request-uuid",
      "employee_name": "John Doe",
      "employee_id": "EMP001",
      "request_type": "missed_checkin",
      "attendance_date": "2026-01-22",
      "status": "pending",
      ...
    },
    ...
  ]
}
```

### Approve Request
```javascript
// Request
POST /attendance/regularization/{id}/approve/
{
  "comments": "Approved - confirmed with employee"
}

// Response
{
  "id": "request-uuid",
  "status": "approved",
  "reviewed_by": "reviewer-uuid",
  "reviewed_at": "2026-01-22T11:00:00Z",
  "reviewer_comments": "Approved - confirmed with employee",
  ...
}
```

---

## Error Handling

### Backend Errors
- **400 Bad Request**: Invalid data or missing required fields
- **401 Unauthorized**: No authentication token
- **403 Forbidden**: Permission denied
- **404 Not Found**: Request ID doesn't exist
- **500 Server Error**: Internal server error

### Frontend Error Handling
- Catches API errors and displays user-friendly messages
- Shows loading spinners during async operations
- Disables buttons during submission
- Validates form data before submission
- Retries on network errors (via axios interceptors)

---

## Authentication

All endpoints require Bearer token authentication:
```javascript
Authorization: Bearer <access_token>
```

The frontend automatically includes this via `axiosInstance` interceptors.

---

## Testing the Integration

### 1. Manual Testing
```bash
# Backend: Verify ViewSet is registered
python manage.py shell
from attendance.models import AttendanceRegularizationRequest
AttendanceRegularizationRequest.objects.all()

# Frontend: Check API service
import { attendanceApi } from '@/api/attendance_api'
await attendanceApi.getRegularizationRequests()
```

### 2. API Testing (Postman/cURL)
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/attendance/regularization/
```

### 3. Frontend Testing
- Open component in browser
- Check Network tab for API calls
- Verify data flows correctly
- Test error scenarios

---

## Common Issues & Solutions

### Issue: No requests showing
**Solution**: Check backend logs for errors, verify employee exists

### Issue: Approve/Reject not working
**Solution**: Ensure user has proper permissions, check token validity

### Issue: CORS errors
**Solution**: Verify CORS settings in Django settings.py

### Issue: Form submission fails
**Solution**: Validate required fields, check console for errors

---

## Future Enhancements

- [ ] Bulk import from CSV
- [ ] Email notifications on approval/rejection
- [ ] Document upload/verification
- [ ] Approval workflow with multiple reviewers
- [ ] Analytics and reports
- [ ] Calendar view for requests
- [ ] Mobile app sync

---

## Related Documentation

- Backend Guidelines: `backend/BACKEND_GUIDELINES.md`
- Frontend Guidelines: `frontend/FRONTEND_GUIDELINES.md`
- Attendance Models: `backend/apps/attendance/models.py`
- Attendance Views: `backend/apps/attendance/views.py`

---

**Last Updated**: January 22, 2026
**Maintainer**: Development Team
