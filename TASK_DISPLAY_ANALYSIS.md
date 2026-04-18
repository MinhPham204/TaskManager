# TaskManager Frontend - Task Display Components Analysis

## 1. CURRENT STATUS VALUES

### Enum Values (Backend)
```typescript
TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  PENDING_APPROVAL = 'Pending Approval',    // NEW: Approval workflow stage
  REJECTED = 'Rejected',                     // NEW: Rejection state
}
```

### Frontend STATUS_DATA Reference
Location: `src/utils/data.js`
```javascript
export const STATUS_DATA = [
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
    { label: "Pending Approval", value: "Pending Approval" },  // ✅ Already defined
    { label: "Completed", value: "Completed" },
    { label: "Rejected", value: "Rejected" },                  // ✅ Already defined
]
```

**Note:** Frontend config already includes `Pending Approval` and `Rejected` statuses!

---

## 2. CURRENT STATUS DISPLAY (Colors & Styling)

### TaskListTable Component
Location: `src/components/TaskListTable.jsx`

```javascript
const getStatusBadgeColor = (status) => {
  switch(status) {
    case 'Completed'     → 'bg-green-100 text-green-500 border border-green-200'
    case 'Pending'       → 'bg-purple-100 text-purple-500 border border-purple-200'
    case 'In Progress'   → 'bg-cyan-100 text-cyan-500 border border-cyan-200'
    default              → 'bg-gray-100 text-gray-500 border border-gray-200'
  }
};
```

**Missing:** No color defined for `Pending Approval` or `Rejected` statuses!

### TaskCard Component
Location: `src/components/Cards/TaskCard.jsx`

```javascript
const tagStyles = {
  status: {
    'Completed':         'bg-green-100 text-green-800',
    'Pending':           'bg-yellow-100 text-yellow-800',
    'In Progress':       'bg-blue-100 text-blue-800',
    'Pending Approval':  'bg-purple-100 text-purple-800',    // ✅ Defined
    'Rejected':          'bg-red-100 text-red-800',          // ✅ Defined
  },
  priority: {
    'High':              'bg-red-100 text-red-800',
    'Medium':            'bg-orange-100 text-orange-800',
    'Low':               'bg-gray-100 text-gray-800',
  },
};
```

**Status:** TaskCard already has colors for new statuses! TaskListTable needs update.

---

## 3. CURRENT ACTION BUTTONS

### TaskListTable
- **No action buttons** - Just displays read-only task information
- Rows are **not clickable**

### TaskCard Component
- **Single clickable card** - Entire card is a link
- Routes based on user role:
  ```javascript
  if (role === "admin" || role === "owner") {
    navigate(`/admin/tasks/edit/${_id}`);
  } else {
    navigate(`/user/task-detail/${_id}`);
  }
  ```

### CreateTask Page (serves as Edit page too)
Location: `src/pages/Admin/CreateTask.jsx`

**Buttons implemented:**
- **Save Task** - Create or Update (POST/PATCH)
- **Delete Task** - Remove task with confirmation
- **Cancel** - Navigate back

**Missing:** Approve/Reject buttons

---

## 4. CURRENT CONDITIONAL RENDERING

### TaskCard Rendering
```javascript
// Team display - conditionally shown for Admin/Owner
{(role === 'owner' || role === 'admin') && team && (
  <span className="flex items-center gap-1 px-2 py-1 text-[10px]">
    <LuUsers className="w-3 h-3" />
    {team.name}
  </span>
)}

// Progress bar color changes by status
<div className={`h-full rounded-full ${
  status === 'Completed' ? 'bg-green-500' : 'bg-blue-600'
}`}></div>

// Unassigned state
{assignedTo.length > 0 ? (
  // Show avatars
) : (
  <span className="text-[10px] text-gray-400">Unassigned</span>
)}
```

### ViewTaskDetails Rendering
Location: `src/pages/User/ViewTaskDetails.jsx`

**Status badge display:**
```javascript
const StatusBadge = ({ status }) => {
  let colorClasses = 'bg-gray-100 text-gray-800'; // Default
  if (status === 'Pending')      → 'bg-purple-100 text-purple-800'
  if (status === 'In Progress')  → 'bg-blue-100 text-blue-800'
  if (status === 'Completed')    → 'bg-green-100 text-green-800'
}
```

**Missing:** No special rendering for `Pending Approval` or `Rejected` statuses!

---

## 5. TASK DATA STRUCTURE DISPLAYED

### Fields Shown in TaskListTable
| Field | Display Type | Format |
|-------|-------------|--------|
| `_id` | Hidden | Used as React key |
| `title` | Text | 1-line truncated |
| `status` | Badge | Color-coded |
| `priority` | Badge | Color-coded |
| `createdAt` | Text (mobile hidden) | 'Do MMM YYYY' (momentjs) |

### Fields Shown in TaskCard
| Field | Display | Purpose |
|-------|---------|---------|
| `_id` | Hidden | Navigation link |
| `title` | Bold heading | 1-line |
| `description` | Text body | 2-line clamp |
| `status` | Badge | Color-coded |
| `priority` | Badge | Color-coded |
| `dueDate` | Text | 'en-GB' locale |
| `assignedTo[]` | Avatar group | First 3 + counter |
| `team` (Admin/Owner) | Badge | Team name |
| `todoCheckList` | Computed | Progress % |
| `progress` | Progress bar | % visualization |
| `comments` | Count icon | Comment count |

### Fields Shown in ViewTaskDetails
| Field | Display | Type |
|-------|---------|------|
| `title` | Page heading | H2 |
| `description` | Body text | Paragraph |
| `status` | Badge | StatusBadge component |
| `priority` | Colored text | InfoItem |
| `dueDate` | Formatted | 'en-GB' locale |
| `assignedTo[]` | Avatar group | Stacked circles |
| `todoCheckList[]` | Checklist | Interactive checkboxes |
| `attachments[]` | Links | Clickable URLs |

---

## 6. EXISTING APPROVAL/REJECTION LOGIC

### Backend Implementation ✅
Location: `backend-nestjs/src/modules/task/`

**Task Schema Fields:**
```typescript
@Prop({ type: Types.ObjectId, ref: 'User', default: null })
approvedBy!: Types.ObjectId | null;

@Prop({ type: String, default: null })
rejectionReason!: string | null;
```

**Service Methods:**
- `submitForApproval(taskId, submittedByName)` → Changes status to `PENDING_APPROVAL`
- `approveTask(taskId, adminId)` → Sets status to `COMPLETED`, progress=100, sets `approvedBy`
- `rejectTask(taskId, dto)` → Sets status to `IN_PROGRESS`, stores `rejectionReason`

**Controller Endpoints:**
- `PATCH /tasks/:id/submit` → Submit for approval
- `PATCH /tasks/:id/approve` → Approve task (Admin/Owner only)
- `PATCH /tasks/:id/reject` → Reject task (Admin/Owner only)

### Frontend Implementation ❌ MISSING
**Not yet implemented in frontend:**
- No approval/rejection buttons in UI
- No RTK Query endpoints for: `submitForApproval`, `approveTask`, `rejectTask`
- No visual indicators for rejection reason
- No pending approvals list
- CreateTask/Edit page doesn't show approval buttons

---

## 7. PRIORITY DISPLAY

### Colors (Consistent across components)
```
High    → bg-red-100 text-red-800
Medium  → bg-orange-100 text-orange-800
Low     → bg-gray-100 text-gray-800
```

### Priority Options
```javascript
export const PRIORITY_DATA = [
    { label: "Low", value: "Low"},
    { label: "Medium", value: "Medium"},
    { label: "High", value: "High"},
]
```

---

## 8. SUMMARY: WHAT NEEDS TO BE ADDED FOR APPROVAL WORKFLOW

### Frontend Changes Needed:
1. **Update TaskListTable** - Add `Pending Approval` and `Rejected` status colors
2. **Add approval buttons** - In EditTask/CreateTask page:
   - "Submit for Approval" (for IN_PROGRESS→PENDING_APPROVAL)
   - "Approve" (for Admin/Owner on PENDING_APPROVAL tasks)
   - "Reject" (with reason modal for Admin/Owner)
3. **Show rejection reason** - Display reason in ViewTaskDetails
4. **Filter tabs** - Update ManageTasks tab to include new statuses
5. **RTK Query hooks** needed:
   ```typescript
   useSubmitForApprovalMutation()
   useApproveTaskMutation()
   useRejectTaskMutation()
   ```
6. **Conditional button visibility** - Based on:
   - Task status (can only approve if PENDING_APPROVAL)
   - User role (only admin/owner can approve)
   - Current assignee/creator (members can submit)

### Task Schema Fields Already Present ✅
- `approvedBy` - Set by approve endpoint
- `rejectionReason` - Set by reject endpoint
- `status` enum includes PENDING_APPROVAL and REJECTED

### Backend Endpoints Already Available ✅
- POST endpoints for approve/reject already exist
- Status transitions already validated

---

## 9. KEY COMPONENTS REFERENCE

| Component | Location | Purpose |
|-----------|----------|---------|
| TaskListTable | `src/components/TaskListTable.jsx` | Admin/list view |
| TaskCard | `src/components/Cards/TaskCard.jsx` | Grid card display |
| ViewTaskDetails | `src/pages/User/ViewTaskDetails.jsx` | Detailed view |
| ManageTasks (Admin) | `src/pages/Admin/ManageTasks.jsx` | Admin task list |
| MyTasks (User) | `src/pages/User/MyTasks.jsx` | User task list |
| CreateTask | `src/pages/Admin/CreateTask.jsx` | Create/Edit form |

---

## 10. CURRENT PAGE ROUTING

| Page | Path | Component | Shows |
|------|------|-----------|-------|
| Manage Tasks (Admin) | `/admin/tasks` | ManageTasks.jsx | Task grid with tabs |
| My Tasks (User) | `/user/my-task` | MyTasks.jsx | User's assigned tasks |
| View Details (User) | `/user/task-detail/:id` | ViewTaskDetails.jsx | Full task info |
| Create Task | `/admin/create-task` | CreateTask.jsx | New task form |
| Edit Task | `/admin/tasks/edit/:id` | CreateTask.jsx (edit mode) | Task form pre-filled |

**Note:** Edit mode uses the same CreateTask component with `taskId` param.
