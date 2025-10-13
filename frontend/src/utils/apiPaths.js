export const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GET_PROFILE: "/api/auth/profile",
        VERIFY_OTP: "/api/auth/verify-otp",
        SIGNUP: "/api/auth/set-password",
        REQUEST_PASSWORD_RESET: "/api/auth/forgot-password",
        RESET_PASSWORD: "/api/auth/reset-password",    
        CHANGE_PASSWORD: "/api/auth/change-password",
    },

    USERS: {
        GET_ALL_USER: "/api/users",
        GET_USER_BY_ID: (userId) => `/api/users/${userId}`,
        CREATE_USER: "/api/users",
        UPDATE_USER: (userId) => `/api/users/${userId}`,
        DELETE_USER: (userId) => `api/users/${userId}`,
    },
    
    TASKS: {
        GET_DASHBOARD_DATA: "/api/tasks/dashboard-data",
        GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard-data",
        GET_ALL_TASKS: "/api/tasks",
        GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
        CREATE_TASK: "/api/tasks",
        UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`,
        DELETE_TASK: (taskId) => `/api/tasks/${taskId}`,

        UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`,
        UPDATE_TODO_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`,
    },

    TEAM: {
        CREATE_TEAM: "/api/teams",
        GET_MY_TEAM_DETAILS: "/api/teams/my-team",
        UPDATE_MY_TEAM_DETAILS: "/api/teams/my-team",
        INVITE_MEMBER: "/api/teams/my-team/invitations",
        REMOVE_MEMBER: (userId) => `/api/teams/my-team/members/${userId}`,
    },

    REPORTS: {
        EXPORT_TASKS: "/api/reports/export/tasks",
        EXPORT_USERS: "/api/reports/export/users",
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image",
    },
};