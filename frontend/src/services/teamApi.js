// src/services/teamApi.js

import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';
import { API_PATHS } from '../utils/apiPaths';

export const teamApi = createApi({
    reducerPath: 'teamApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Team'],
    endpoints: (builder) => ({
        // Lấy chi tiết team (đã có từ trước)
        getMyTeamDetails: builder.query({
            query: () => ({ url: API_PATHS.TEAM.GET_MY_TEAM_DETAILS, method: 'get' }),
            providesTags: ['Team'],
        }),
        // Mutation để mời thành viên
        inviteMember: builder.mutation({
            query: (invitationData) => ({ // { email, role }
                url: API_PATHS.TEAM.INVITE_MEMBER,
                method: 'post',
                data: invitationData,
            }),
            invalidatesTags: ['Team'], // Làm mới lại danh sách team để thấy lời mời
        }),
        acceptInvitation: builder.mutation({
            query: (token) => ({ // { email, role }
                url: API_PATHS.TEAM.ACCEPT_INVITATION,
                method: 'post',
                data: token,
            }),
            invalidatesTags: ['Team'], 
        }),
        // Mutation để xóa thành viên
        removeMember: builder.mutation({
            query: (userId) => ({
                url: API_PATHS.TEAM.REMOVE_MEMBER(userId),
                method: 'delete',
            }),
            invalidatesTags: ['Team'], // Làm mới lại danh sách thành viên
        }),
    }),
});

export const {
    useGetMyTeamDetailsQuery,
    useInviteMemberMutation,
    useAcceptInvitationMutation,
    useRemoveMemberMutation,
} = teamApi;