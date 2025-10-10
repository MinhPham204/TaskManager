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
  }),
});

export const { useGetUsersQuery } = userApi;