import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import taskReducer from "./taskSlice";
import { taskApi } from "../services/taskApi";
import { userApi } from "../services/userApi";
import { teamApi } from "../services/teamApi";
import { authApi } from "../services/authApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    [authApi.reducerPath]: authApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [userApi.reducerPath]: userApi.reducer, 
    [teamApi.reducerPath]: teamApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, taskApi.middleware, userApi.middleware, teamApi.middleware),
});