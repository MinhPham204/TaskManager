// src/services/organizationApi.js

import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';
import { API_PATHS } from '../utils/apiPaths';

export const organizationApi = createApi({
    reducerPath: 'organizationApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Organization', 'PendingInvitations'],
    endpoints: (builder) => ({
        // Get all organizations
        getAllOrganizations: builder.query({
            query: () => ({
                url: API_PATHS.ORGANIZATIONS.GET_ALL_ORG,
                method: 'get',
            }),
            providesTags: ['Organization'],
        }),

        // Get organization by ID
        getOrganizationById: builder.query({
            query: (orgId) => ({
                url: API_PATHS.ORGANIZATIONS.GET_ORG_BY_ID(orgId),
                method: 'get',
            }),
            providesTags: ['Organization'],
        }),

        // Create organization
        createOrganization: builder.mutation({
            query: (orgData) => ({
                url: API_PATHS.ORGANIZATIONS.CREATE_ORG,
                method: 'post',
                data: orgData,
            }),
            invalidatesTags: ['Organization'],
        }),

        // Add member to organization (invite)
        addMember: builder.mutation({
            query: ({ orgId, email, role }) => ({
                url: API_PATHS.ORGANIZATIONS.ADD_MEMBER(orgId),
                method: 'post',
                data: { email, role },
            }),
            invalidatesTags: ['Organization', 'PendingInvitations'],
        }),

        // Accept organization invitation
        acceptInvitation: builder.mutation({
            query: (orgId) => ({
                url: API_PATHS.ORGANIZATIONS.ACCEPT_INVITATION(orgId),
                method: 'post',
            }),
            invalidatesTags: ['Organization', 'PendingInvitations'],
        }),

        // Get pending invitations for current user
        getPendingInvitations: builder.query({
            query: () => ({
                url: API_PATHS.ORGANIZATIONS.GET_PENDING_INVITATIONS,
                method: 'get',
            }),
            providesTags: ['PendingInvitations'],
        }),

        // Remove member from organization
        removeMember: builder.mutation({
            query: ({ orgId, userId }) => ({
                url: API_PATHS.ORGANIZATIONS.REMOVE_MEMBER(orgId, userId),
                method: 'delete',
            }),
            invalidatesTags: ['Organization'],
        }),
    }),
});

export const {
    useGetAllOrganizationsQuery,
    useGetOrganizationByIdQuery,
    useCreateOrganizationMutation,
    useAddMemberMutation,
    useAcceptInvitationMutation,
    useGetPendingInvitationsQuery,
    useRemoveMemberMutation,
} = organizationApi;
