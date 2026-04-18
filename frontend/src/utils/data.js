import {
    LuLayoutDashboard,
    LuUser,
    LuClipboardCheck,
    LuSquarePlus,
    LuLogOut,
    LuBuilding2, // Icon cho Organization
    LuUsersRound,    // Icon cho Manage Teams
} from "react-icons/lu";

// MENU DÀNH CHO OWNER (QUẢN TRỊ CÔNG TY)
export const SIDE_MENU_OWNER_DATA = [
    {
        id: "01",
        label: "Org Dashboard",
        icon: LuLayoutDashboard,
        path: "/admin/dashboard" // Dùng chung hoặc /owner/dashboard
    },
    {
        id: "02",
        label: "Manage Organization",
        icon: LuBuilding2,
        path: "/owner/organization", // Trang quản lý nhân sự toàn công ty
    },
    {
        id: "03",
        label: "Manage Teams",
        icon: LuUsersRound,
        path: "/admin/teams", // Trang quản lý các đội nhóm
    },
    {
        id: "04",
        label: "Manage Tasks",
        icon: LuClipboardCheck,
        path: "/admin/tasks",
    },
    {
        id: "05",
        label: "Create Task",
        icon: LuSquarePlus,
        path: "/admin/create-task",
    },
    {
        id: "06",
        label: "Logout",
        icon: LuLogOut,
        path: "logout",
    },
];

// MENU DÀNH CHO ADMIN (QUẢN TRỊ TEAM)
export const SIDE_MENU_DATA = [
    {
        id: "01",
        label: "Team Dashboard",
        icon: LuLayoutDashboard,
        path: "/admin/dashboard"
    },
    {
        id: "02",
        label: "Manage Tasks",
        icon: LuClipboardCheck,
        path: "/admin/tasks",
    },
    {
        id: "03",
        label: "Create Task",
        icon: LuSquarePlus,
        path: "/admin/create-task",
    },
    {
        id: "04",
        label: "Team Members",
        icon: LuUser,
        path: "/admin/users",
    },
    {
        id: "05",
        label: "Logout",
        icon: LuLogOut,
        path: "logout",
    },
];

// MENU DÀNH CHO MEMBER (NHÂN VIÊN)
export const SIDE_MENU_USER_DATA = [
    {
        id: "01",
        label: "My Dashboard",
        icon: LuLayoutDashboard,
        path: "/user/dashboard",
    },
    {
        id: "02",
        label: "My Tasks",
        icon: LuClipboardCheck,
        path: "/user/my-task",
    },
    {
        id: "03",
        label: "My Teams",
        icon: LuUser,
        path: "/user/my-team",
    },
    {
        id: "04",
        label: "Logout",
        icon: LuLogOut,
        path: "logout",
    },
];

export const PRIORITY_DATA = [
    { label: "Low", value: "Low"},
    { label: "Medium", value: "Medium"},
    { label: "High", value: "High"},
]

export const STATUS_DATA = [
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
    { label: "Pending Approval", value: "Pending Approval" }, 
    { label: "Completed", value: "Completed" },
    { label: "Rejected", value: "Rejected" }, 
]