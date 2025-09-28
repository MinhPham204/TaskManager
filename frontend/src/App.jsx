import React, {useContext} from 'react'
import { UserContext } from './context/userContext';
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
import UserProvider from './context/userProvider';


const App = () => {
  return(
      <UserProvider>
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
      </UserProvider>
  )
}

export default App

const Root = () => {
  const {user, loading} = useContext(UserContext);

  if(loading) return <Outlet/>

  if(!user) {
    return <Navigate to="/login" />
  }
  return user.role === "admin" ? <Navigate to="/admin/dashboard"/> : <Navigate to="/user/dashboard"/>;
};