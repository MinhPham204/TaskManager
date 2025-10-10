import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import taskReducer from "./taskSlice";
import { taskApi } from "../services/taskApi";
import { userApi } from "../services/userApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [userApi.reducerPath]: userApi.reducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(taskApi.middleware, userApi.middleware),
});