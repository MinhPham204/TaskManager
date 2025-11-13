import React, {useState} from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from "../../components/Inputs/Input"
import { validateEmail } from '../../utils/helper';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/authSlice';
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const location = useLocation();
  //Handle Login Form Submit
  const handleLogin = async (e) => {
    e.preventDefault();

    if(!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if(!password){
      setError("Please enter the password");
      return;
    }
    setError("");

    // API Call
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, role } = response.data;
      console.log("token: ", token);

      if (token) {
        localStorage.setItem("token", token);
        dispatch(setUser(response.data));

        // Lấy thông tin redirect từ query string 
        const query = new URLSearchParams(location.search);
        const from = query.get("from"); // vd: /accept-invite?token=abc123

        if (from) {
          // Giải mã URL trước khi navigate
          const decodedPath = decodeURIComponent(from);
          console.log("Redirecting to (invite flow):", decodedPath);

          navigate(decodedPath, { replace: true });
        } else {
          // Logic mặc định nếu không có from
          const defaultPath =
            role === "admin" ? "/admin/dashboard" : "/user/dashboard";
          console.log("Redirecting to (default):", defaultPath);

          navigate(defaultPath, { replace: true });
        }
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }


  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Welcome Back</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to log in
        </p>
        <form onSubmit={handleLogin}>
          <Input
            value={email}
            onChange={({target}) => setEmail(target.value)}
            label="Email Address"
            placeholder="john@example.com"
            type="text"
          />

          <Input
            value={password}
            onChange={({target}) => setPassword(target.value)}
            label="Password"
            placeholder=""
            type="password"
          />
          <div className="text-right mt-1 mb-3">
              <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-primary underline"
              >
                  Forgot Password?
              </Link>
          </div>
          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

          <button type="submit" className="btn-primary">Login</button>
          <p className="text-[13px] text-slate-800 mt-3">Don't have an account?{" "}
            <Link className="font-medium text-primary underline" to="/signup">SignUp</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Login
