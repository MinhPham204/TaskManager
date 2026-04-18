# 📝 TaskManager SaaS - Development Memory Log

## 📂 Project Context
- **Current State**: Backend has been fully migrated from Express/JS to **NestJS/TypeScript**.
- **Architecture**: Multi-tenant SaaS (Data isolation via `organizationId`).
- **Frontend Tech**: ReactJS, Redux Toolkit, Axios.

---

## 🚀 Backend Source of Truth (For FE Refactoring)

### 1. Authentication & Security
- **Mechanism**: JWT with Access Token & Refresh Token (Redis-backed).
- **Multi-tenancy**: Mọi Request cần có `organizationId` (thường được trích xuất từ Token phía Backend).
- **Global RBAC Roles**: `Owner` (Full access), `Admin` (Team management), `Member` (Task execution).

### 2. Team Management Architecture (✅ REFACTORED - NEW SCHEMA)
Hệ thống quản lý Team vừa được tái cấu trúc để tối ưu dữ liệu và bảo mật:
- **Schema Design**: ✅ Không còn sử dụng 3 mảng độc lập (`owner`, `admins`, `members`). Thay vào đó, sử dụng **1 mảng duy nhất `members`** chứa Sub-document `{ user: ObjectId, role: Enum(owner, admin, member) }`.
- **Backend Refactor**: 
  - Schema: `members: [{ user: ObjectId, role: TeamMemberRole }]`
  - Service: create(), findAll(), findById(), getMyTeams(), addMember(), removeMember(), promoteToAdmin() — tất cả đã cập nhật
  - Populate: `.populate('members.user', 'name email profileImageUrl')`
  - Query: `{ 'members.user': userId }` thay vì `{ $or: [owner, admins, members] }`
- **Query Logic**: Tìm kiếm team của user cực kỳ tối ưu qua `{ 'members.user': userId }`. Dữ liệu trả về (Payload) hoàn toàn phẳng (flat) và không bị trùng lặp user.
- **Frontend Normalization**: UserTable xử lý format mới `{ user: {...}, role: 'owner|admin|member' }`
- **Strict RBAC (Team Level)**: Backend áp dụng strict rules ở cách layer:
  - Không ai được xóa `Owner` (role check)
  - `Admin` chỉ xóa được `Member` trong members array
  - `Member` không có quyền xóa ai
  - Không cho phép tự xóa bản thân qua API này (phải dùng chức năng "Leave Team" riêng)

### 3. Task Management Workflow (New States)
Hệ thống hiện tại sử dụng các trạng thái Task mở rộng:
- `Pending`: Mới tạo.
- `In Progress`: Đang thực hiện.
- `Pending Approval`: Member đã nộp, chờ Admin duyệt. (Mới)
- `Completed`: Đã được Admin phê duyệt hoặc hoàn thành trực tiếp.
- `Rejected`: Bị Admin từ chối phê duyệt. (Mới - kèm theo `rejectionReason`).

### 4. Key Endpoints & Logic
- **Task Submit**: `PATCH /tasks/:id/submit` (Dành cho Member).
- **Approval Logic**: `PATCH /tasks/:id/approve` và `PATCH /tasks/:id/reject` (Chỉ dành cho Admin/Owner).
- **Reports**: `GET /tasks/reports/workload` (Aggregation Pipeline trả về thống kê byStatus, byPriority, byAssignee).

---

## 🛠️ Frontend Refactor Requirements (Instructions for Roo Code)

### 1. Axios & Data Fetching (`src/utils/axiosInstance.js`)
✅ **COMPLETED** - Refresh Token + Tenant Isolation đã triển khai

### 2. Redux Store Update (`src/store/`)
✅ **COMPLETED** (Step 1/2)
- **authSlice**: Đã chứa đầy đủ user.role, user.organization, và selector selectCanApprove() ✓
- **taskApi NEW Endpoints**:
  - `submitForApproval(taskId)` — PATCH /tasks/:id/submit (Member submit task)
  - `approveTask({ taskId, ...data })` — PATCH /tasks/:id/approve (Admin/Owner)
  - `rejectTask({ taskId, rejectionReason })` — PATCH /tasks/:id/reject (Admin/Owner)
  - `getWorkloadReport(params)` — GET /tasks/reports/workload (Aggregation stats)
- **Hooks Exported**: useSubmitForApprovalMutation, useApproveTaskMutation, useRejectTaskMutation, useGetWorkloadReportQuery
- **authSlice**: Lưu trữ `user.role` và `user.organization` để phân quyền UI (ẩn/hiện nút).
- **taskSlice/api**: Thêm các hàm `submitForApproval`, `approveTask`, `rejectTask` và `getWorkloadReport`.

### 3. UI/UX Updates
- **Team Management (UserTable.jsx)** ✅ **COMPLETED**:
  - ✅ **No Deduplication Needed**: API giờ trả về 1 mảng `team.members` sạch sẽ, hiển thị trực tiếp bằng hàm map() mà không cần logic làm phẳng (flatten) như cũ.
  - ✅ **Frontend RBAC**: Function `canRemoveMember()` ẩn/hiện nút xóa (Trash icon) dựa trên Ma trận quyền đã định nghĩa ở Backend (Owner > Admin > Member).
  - ✅ **Role badges**: Owner (purple), Admin (indigo), Member (green)
  - ✅ Fixed pages: MyTeams + ManageUsers import + pass auth data
  
- **Task Components** ✅ **COMPLETED**: 
  - ✅ Status colors: Pending Approval (yellow), Rejected (red)
  - ✅ Action buttons: Submit (blue), Approve (green), Reject (red)
  - ✅ Conditional rendering: Submit (member, 100% progress), Approve/Reject (admin/owner, Pending Approval)
  - ✅ Rejection reason display: Show under status badge if rejected
  - ✅ Modal for rejection reason input
- **Task RBAC UI Control** ⏳ **TODO**: 
  - Member chỉ thấy nút "Submit" khi task đạt 100% progress.
  - Admin/Owner thấy nút "Approve/Reject" cho các task đang chờ duyệt.
- **Dashboard** ✅ **COMPLETED**: 
  - ✅ Admin Dashboard: Sử dụng useGetWorkloadReportQuery() để lấy byStatus, byPriority
  - ✅ User Dashboard: Same as Admin
  - ✅ InfoCards: Tính từ workloadReport.byStatus
  - ✅ Pie/Bar charts: Tính từ workloadReport thay vì manual calculation
  - ✅ RecentTasks: Vẫn dùng getDashboardData() để lấy recentTasks list

---

## ✅ FRONTEND REFACTOR - ALL STEPS COMPLETED

### Summary:
1. ✅ **Axios & Refresh Token** — Token management + tenant isolation
2. ✅ **Redux Store** — taskApi mutations/queries + new endpoints
3. ✅ **UI/UX Updates**:
   - ✅ **3A. UserTable** — RBAC xóa thành viên + role badges
   - ✅ **3B. TaskListTable** — Status colors + action buttons (Submit/Approve/Reject)
   - ✅ **3C. Dashboard** — Workload report aggregation data

### Backend Refactor ✅
- ✅ **Team Schema**: members → [{ user, role }]
- ✅ **Team Service**: All methods updated to use new schema
- ✅ **Compilation**: ✓ No errors

---

## 🎯 Additional Frontend Enhancements (Post-Refactor)

### Navigation & UX Improvements ✅ **COMPLETED**
1. **Breadcrumb Component** ✅
   - Location: `src/components/Breadcrumb.jsx`
   - Props: items (array of { label, href })
   - Displays: Home > Current Path > Page
   - Reusable across all pages

2. **Team Selection Workflow** ✅
   - **TeamList Component** (`src/components/TeamList.jsx`)
     - Displays all teams user belongs to
     - Click to select team
     - Shows member count, description, creation date
   - **TeamDetails Component** (`src/components/TeamDetails.jsx`)
     - Shows selected team info
     - Displays members table (reuses UserTable)
     - Back button to return to list
     - Invite member button (admin/owner only)

3. **Pages Refactored** ✅
   - **ManageUsers** (`/admin/users`)
     - Master-detail: Team List → Team Details
     - Breadcrumb: Admin > Team Members > [Selected Team]
     - Can manage multiple teams sequentially
   - **MyTeams** (`/user/my-team`)
     - Master-detail: Team List → Team Details  
     - Breadcrumb: Dashboard > My Teams > [Selected Team]
     - View teams user is member of

### Workflow:
1. User lands on page → sees list of teams
2. Clicks team → enter detail view with members + management
3. See breadcrumb showing: Page Path > Selected Team
4. Click back button or breadcrumb link to return to list

---

## ⚠️ Important Rules for Roo Code
1. **No TS Conversion**: Giữ nguyên ReactJS (Javascript). Không tự ý convert sang TypeScript ở phía Frontend.
2. **Selective Reading**: Chỉ đọc các file Component liên quan đến luồng Task, Auth và Team (UserTable).
3. **Data Mapping**: Lưu ý kết quả trả về từ NestJS thường bọc trong object (ví dụ: `res.data`). Kiểm tra kỹ cấu trúc JSON trả về từ API (nhất là cấu trúc `team.members` mới) trước khi mapping vào State.