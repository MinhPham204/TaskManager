export const BASE_URL = "http://localhost:8001";

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        REFRESH_TOKEN: "/api/auth/refresh",
        LOGOUT: "/api/auth/logout",
        GET_PROFILE: "/api/auth/profile",
        VERIFY_OTP: "/api/auth/verify-otp",
        SET_PASSWORD: "/api/auth/set-password",
        SIGNUP: "/api/auth/set-password",
        REQUEST_PASSWORD_RESET: "/api/auth/forgot-password",
        RESET_PASSWORD: "/api/auth/reset-password",
        CHANGE_PASSWORD: "/api/auth/change-password",
    },

    USERS: {
        GET_ALL_USER: "/api/users",
        SEARCH_USER: "api/users/search",
        GET_USER_BY_ID: (userId) => `/api/users/${userId}`,
        CREATE_USER: "/api/users",
        UPDATE_USER: (userId) => `/api/users/${userId}`,
        DELETE_USER: (userId) => `api/users/${userId}`,
    },
    
    TASKS: {
        GET_DASHBOARD_DATA: "/api/tasks/dashboard/admin",
        GET_USER_DASHBOARD_DATA: "/api/tasks/dashboard/user",
        GET_ALL_TASKS: "/api/tasks",
        GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
        CREATE_TASK: "/api/tasks",
        UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`,
        DELETE_TASK: (taskId) => `/api/tasks/${taskId}`,

        UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`,
        UPDATE_TODO_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`,
        
        SUBMIT_FOR_APPROVAL: (taskId) => `/api/tasks/${taskId}/submit`,
        APPROVE_TASK: (taskId) => `/api/tasks/${taskId}/approve`,
        REJECT_TASK: (taskId) => `/api/tasks/${taskId}/reject`,
        GET_WORKLOAD_REPORT: "/api/tasks/reports/workload",
    },

    TEAM: {
        CREATE_TEAM: "/api/teams",
        GET_MY_TEAM_DETAILS: "/api/teams/my-teams",
        UPDATE_MY_TEAM_DETAILS: "/api/teams/my-team",
        INVITE_MEMBER: "/api/teams/my-team/invitations",
        ACCEPT_INVITATION: "/api/teams/my-team/accept-invitation",
        REMOVE_MEMBER: (userId) => `/api/teams/my-team/members/${userId}`,
    },

    ORGANIZATIONS: {
        CREATE_ORG: "/api/organizations",
        GET_ALL_ORG: "/api/organizations",
        GET_ORG_BY_ID: (orgId) => `/api/organizations/${orgId}`,
        ADD_MEMBER: (orgId) => `/api/organizations/${orgId}/members`,
        REMOVE_MEMBER: (orgId, userId) => `/api/organizations/${orgId}/members/${userId}`,
        ACCEPT_INVITATION: (orgId) => `/api/organizations/${orgId}/accept-invitation`,
        GET_PENDING_INVITATIONS: "/api/organizations/pending-invitations",
    },

    REPORTS: {
        EXPORT_TASKS: "/api/report/export/tasks",
        EXPORT_USERS: "/api/report/export/users",
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image",
    },
};