import React from 'react'
import { useSelector } from 'react-redux'
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

import PrivateRoute from "./routes/PrivateRoutes";
import Dashboard from "./pages/Admin/Dashboard";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import ManageTasks from "./pages/Admin/ManageTasks";
import CreateTask from "./pages/Admin/CreateTask";
import ManageUsers from "./pages/Admin/ManageUsers";
import UserDashboard from "./pages/User/UserDashboard";
import MyTasks from "./pages/User/MyTasks";
import ViewTaskDetails from "./pages/User/ViewTaskDetails";
import { fetchProfile } from './store/authSlice';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';


const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchProfile());
    }
    else {
      // No token: ensure loading false so Root can redirect
      // handled by initial state
    }
  }, [dispatch]);

  return(
        <div>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />}/>
            <Route path="/signup" element={<SignUp />}/>

            {/*Admin Routes*/}
            <Route element={<PrivateRoute allowedRoles={["admin"]}/>}>
              <Route path="/admin/dashboard" element={<Dashboard />}/>
              <Route path="/admin/tasks" element={<ManageTasks />}/>
              <Route path="/admin/create-task" element={<CreateTask />}/>
              <Route path="/admin/tasks/edit/:taskId" element={<CreateTask />}/>
              <Route path="/admin/users" element={<ManageUsers />}/>
              </Route> 
            {/* {User Routes} */}
            <Route element={<PrivateRoute allowedRoles={["user"]}/>}>
              <Route path="/user/dashboard" element={<UserDashboard />}/>
              <Route path="/user/my-task" element={<MyTasks/>}/>
              <Route path="/user/task-detail/:id" element={<ViewTaskDetails/>}/>

            </Route>  
            <Route path="/" element={<Root/>}/>
          </Routes>
        </BrowserRouter>
       </div>
  )
}

export default App

const Root = () => {
  const { user, loading } = useSelector((state) => state.auth);

  if(loading) return <Outlet/>

  if(!user) {
    return <Navigate to="/login" />
  }
  return user.role === "admin" ? <Navigate to="/admin/dashboard"/> : <Navigate to="/user/dashboard"/>;
};