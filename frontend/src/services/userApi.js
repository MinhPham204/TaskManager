import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery'; 
import { API_PATHS } from '../utils/apiPaths';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => ({ url: API_PATHS.USERS.GET_ALL_USER, method: 'get' }), 
      providesTags: ['User'],
    }),
    searchUsers: builder.query({
      query: (searchTerm) => ({ url: `${API_PATHS.USERS.SEARCH_USER}?q=${searchTerm}`, 
      method: 'get' }), 
    }),
  }),
});

export const { useGetUsersQuery, useSearchUsersQuery } = userApi;