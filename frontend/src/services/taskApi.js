import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';
import { API_PATHS } from '../utils/apiPaths';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getDashboardData: builder.query({
      query: () => ({ url: API_PATHS.TASKS.GET_DASHBOARD_DATA, method: 'get' }),
      providesTags: ['Dashboard'], 
    }),
    getUserDashboardData: builder.query({
      query: () => ({ url: API_PATHS.TASKS.GET_USER_DASHBOARD_DATA, method: 'get' }),
      providesTags: ['UserDashboard'], 
    }),
    getTasks: builder.query({
      query: (params) => ({ url: API_PATHS.TASKS.GET_ALL_TASKS, method: 'get', params }),
      transformResponse: (response) => response.tasks,
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Task', id: _id })), { type: 'Task', id: 'LIST' }]
          : [{ type: 'Task', id: 'LIST' }],
    }),
    getTaskById: builder.query({
      query: (id) => ({ url: API_PATHS.TASKS.GET_TASK_BY_ID(id), method: 'get'}), 
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation({
      query: (newTask) => ({ url: API_PATHS.TASKS.CREATE_TASK, method: 'post', data: newTask }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: builder.mutation({
      query: ({ _id, ...patch }) => ({
        url: API_PATHS.TASKS.UPDATE_TASK(_id), 
        method: 'patch',
        data: patch,
      }),
      invalidatesTags: (result, error, { _id }) => [{ type: 'Task', id: _id }],
    }),
    deleteTask: builder.mutation({
      query: (_id) => ({
        url: API_PATHS.TASKS.DELETE_TASK(_id), 
        method: 'delete',
      }),
      invalidatesTags: (result, error, _id) => [{ type: 'Task', id: _id }],
    }),
  }),
});

export const {
  useGetDashboardDataQuery,
  useGetUserDashboardDataQuery,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;