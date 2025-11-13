import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Inputs/Input";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useSelector, useDispatch } from 'react-redux';
import { setUser, clearUser, fetchProfile } from '../../store/authSlice';

const SignUp = () => {
  const [step, setStep] = useState(1); // 1: nhập email, 2: verify otp, 3: thông tin khác
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState("");
  const [verifiedToken, setVerifiedToken] = useState(null);

  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

const handleRegister = async (e) => {
  e.preventDefault();

  if (!validateEmail(email)) {
    setError("Please enter a valid email address.");
    return;
  }

  setError("");
  setStep(2); // Chuyển UI sang màn hình OTP

  try {
    await axiosInstance.post(API_PATHS.AUTH.REGISTER, { email });
    // Nếu gọi thành công thì giữ nguyên step 2
  } catch (error) {
    setStep(1); // Quay lại nhập email nếu lỗi
    if (error.response && error.response.data.message) {
      setError(error.response.data.message);
    } else {
      setError("Failed to send OTP. Please try again.");
    }
  }
};

 
// Step 2: Verify OTP
const handleVerifyOtp = async (e) => {
  e.preventDefault();

  if (!otp) {
    setError("Please enter the OTP.");
    return;
  }

  setError("");

  try {
    const response = await axiosInstance.post(API_PATHS.AUTH.VERIFY_OTP, { email, otp });

    const token = response.data.verifiedToken;
    setVerifiedToken(token);
    localStorage.setItem("verifiedToken", token);

    setStep(3);
  } catch (error) {
    if (error.response && error.response.data.message) {
      setError(error.response.data.message);
    } else {
      setError("Invalid OTP. Please try again.");
    }
  }
};

const handleFinalSignUp = async (e) => {
  e.preventDefault();

  if (!fullName) {
    setError("Please enter your full name.");
    return;
  }
  if (!password) {
    setError("Please enter your password.");
    return;
  }

  setError("");

  try {
    const token = localStorage.getItem("verifiedToken"); // lấy đúng key đã lưu ở step 2

    const response = await axiosInstance.post(
      API_PATHS.AUTH.SIGNUP,
      {
        fullName,
        password,
        profilePic,
      },
    );

    const { token: accessToken, role } = response.data;

    if (accessToken) {
      localStorage.setItem("token", accessToken);
      dispatch(setUser(response.data));

      const defaultPatch = role === "admin" ? "admin/dashboard" : "user/dashboard";
      navigate(defaultPatch, {replace: true});
    }
  } catch (error) {
    console.error("Signup error:", error);
    if (error.response && error.response.data.message) {
      setError(error.response.data.message);
    } else {
      setError("Sign up failed. Please try again.");
    }
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-center text-gray-900">
          {step === 1 && "Sign Up with Email"}
          {step === 2 && "Verify Your Email"}
          {step === 3 && "Complete Your Profile"}
        </h3>
        <p className="text-sm text-gray-600 text-center mt-2 mb-6">
          {step === 1 && "Enter your email to receive a verification code."}
          {step === 2 && "We’ve sent a 6-digit code to your email."}
          {step === 3 && "Fill in your details to finish registration."}
        </p>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="john@example.com"
              type="text"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              Send OTP
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              value={otp}
              onChange={({ target }) => setOtp(target.value)}
              label="OTP Code"
              placeholder="Enter the code"
              type="text"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition cursor-pointer"
            >
              Back
            </button>
          </form>
        )}

        {/* Step 3: Thông tin khác */}
        {step === 3 && (
          <form onSubmit={handleFinalSignUp} className="space-y-4">
            <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
            <Input
              value={fullName}
              onChange={({ target }) => setFullName(target.value)}
              label="Full Name"
              placeholder="John"
              type="text"
            />
            <Input
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              label="Password"
              placeholder="Min 8 characters"
              type="password"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition cursor-pointer"
            >
              Sign Up
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-sm text-gray-600 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
