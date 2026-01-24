# Quick Reference: Attendance Request Integration

## 🎯 What Was Done

Connected your Attendance Request frontend to the backend API by:

1. **Backend**: Created `AttendanceRegularizationRequestViewSet` with full CRUD operations
2. **Frontend API**: Created `attendance_api.js` service for making backend calls
3. **UI Component**: Updated `AttendanceRequests.js` to fetch and manage requests from backend
4. **Styling**: Enhanced CSS for loading, error, and empty states

---

## 🔗 Connection Points

### Backend Endpoint
```
Base URL: /api/attendance/regularization/

Endpoints:
GET    /                    → List requests
POST   /                    → Create request
GET    /<id>/               → Get request
PUT    /<id>/               → Update request
DELETE /<id>/               → Delete request
GET    /pending/            → Get pending only
POST   /<id>/approve/       → Approve
POST   /<id>/reject/        → Reject
```

### Frontend Service
```javascript
// Import in components:
import attendanceApi from '@/api/attendance_api';

// Usage:
const requests = await attendanceApi.getRegularizationRequests();
await attendanceApi.approveRequest(requestId);
await attendanceApi.rejectRequest(requestId);
```

---

## 📋 Request Lifecycle

```
1. CREATE → POST /regularization/ → Returns pending request
2. LIST   → GET /regularization/ → Shows in table
3. FILTER → User clicks status filter → Frontend filters local state
4. SEARCH → User types name → Frontend searches locally
5. APPROVE/REJECT → POST /<id>/approve/ or /reject/ → Status updates
6. SYNC → Local state updates immediately
```

---

## 🎨 Component States

### Loading
```
Shows spinner while fetching requests
```

### Displaying Data
```
Table with columns:
- Checkbox (select)
- Employee (name + ID)
- Request Type
- Date
- Status (badge)
- Actions (approve/reject buttons)
```

### Filtering
```
Tabs: All | Pending | Approved | Rejected
Shows count of pending requests
```

### Creating Request
```
Modal Form with:
- Employee ID*
- Request Type (dropdown)
- Attendance Date*
- Check-In Time
- Check-Out Time
- Reason (textarea)

*Required fields
```

### Error Handling
```
Red alert bar at top of component
Shows error message with close button
Auto-clears when user closes
```

---

## 💾 Data Structure

### Request Object (from backend)
```javascript
{
  id: "uuid",
  employee: "employee-uuid",
  employee_name: "John Doe",
  employee_id: "EMP001",
  attendance: "attendance-uuid",
  attendance_date: "2026-01-22",
  request_type: "missed_checkin", // full_day, missed_checkin, missed_checkout, late_arrival, early_departure
  requested_check_in: "2026-01-22T09:00:00Z", // ISO datetime
  requested_check_out: "2026-01-22T18:00:00Z", // ISO datetime
  reason: "System was down",
  status: "pending", // pending, approved, rejected, cancelled
  reviewed_by: "reviewer-uuid",
  reviewed_by_name: "Manager Name",
  reviewed_at: "2026-01-22T10:00:00Z",
  reviewer_comments: "Approved",
  created_at: "2026-01-22T08:00:00Z",
  updated_at: "2026-01-22T10:00:00Z"
}
```

---

## 🔧 How to Use

### In the Frontend

1. **Load Requests**
   ```javascript
   const response = await attendanceApi.getRegularizationRequests();
   setRequests(response.data.results);
   ```

2. **Filter by Status**
   ```javascript
   const pending = requests.filter(r => r.status === 'pending');
   ```

3. **Approve a Request**
   ```javascript
   await attendanceApi.approveRequest(requestId, { comments: "Looks good" });
   ```

4. **Create New Request**
   ```javascript
   await attendanceApi.createRegularizationRequest({
     employee: employeeId,
     attendance: attendanceId,
     request_type: 'missed_checkin',
     requested_check_in: "2026-01-22T09:00:00Z",
     reason: "System was down"
   });
   ```

---

## 🐛 Debugging Tips

### Check Network Calls
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Create/Approve/Reject requests
4. Check request/response in Network tab

### Check Frontend State
```javascript
// In browser console:
console.log(requests); // See all requests
console.log(error);    // See current error
console.log(loading);  // See loading state
```

### Check Backend Logs
```bash
# Terminal where Django is running
python manage.py runserver

# Should show:
# [22/Jan/2026 10:30:45] "POST /api/attendance/regularization/ HTTP/1.1" 201
```

---

## ✅ Verification Checklist

- [ ] Backend ViewSet created and migrations run
- [ ] Frontend loads without errors
- [ ] Can see requests in table
- [ ] Can search/filter requests
- [ ] Can approve/reject requests
- [ ] Can create new request
- [ ] Error messages display correctly
- [ ] Approval updates status immediately

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `backend/apps/attendance/views.py` | API ViewSet for requests |
| `backend/apps/attendance/urls.py` | URL routing for requests |
| `frontend/api/attendance_api.js` | API service layer |
| `frontend/components/.../AttendanceRequests.js` | React component |
| `frontend/components/.../AttendanceRequests.css` | Styling |
| `ATTENDANCE_REQUEST_INTEGRATION.md` | Full documentation |
| `INTEGRATION_SUMMARY.md` | Detailed summary |

---

## 🎓 Key Concepts

### MVP (Minimum Viable Product)
✅ Completed:
- View all requests
- Create requests
- Approve/Reject requests
- Filter by status
- Search by name

### Features Used
- Django REST Framework ViewSets
- React Hooks (useState, useEffect)
- Axios for HTTP requests
- Form validation
- Error handling
- Loading states

---

## 🚀 To Start Using

1. **Ensure Django is running**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Ensure Frontend is running**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to Attendance Requests**
   - Go to sidebar → Attendance → Requests
   - Should load requests from backend

4. **Test Operations**
   - Try creating a request
   - Try approving one
   - Try searching

---

## 💡 Tips & Tricks

1. **Real-time Updates**: Refresh page to see latest data
2. **Bulk Actions**: Select multiple → Approve/Reject all at once
3. **Error Recovery**: Close error alert and try again
4. **Request Reason**: Always add reason for approval/rejection
5. **Date Format**: Use YYYY-MM-DD for date fields

---

**Last Updated**: January 22, 2026
**Version**: 1.0.0 - Initial Release
