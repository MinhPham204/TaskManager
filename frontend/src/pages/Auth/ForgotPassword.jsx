// src/pages/Auth/ForgotPassword.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { LuMail, LuKey, LuShieldCheck } from 'react-icons/lu';

const ForgotPassword = () => {
    // State để quản lý 3 bước
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Mật khẩu mới
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // State cho UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const navigate = useNavigate();

    // Bước 1: Gửi yêu cầu OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.REQUEST_PASSWORD_RESET, { email });
            setMessage(response.data.message);
            setStep(2); // Chuyển sang bước 2
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Bước 2: Xác nhận OTP (chỉ là bước UI, không gọi API)
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }
        setError('');
        setStep(3); // Chuyển sang bước 3
    };

    // Bước 3: Gửi OTP và mật khẩu mới để reset
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.RESET_PASSWORD, { email, otp, newPassword });
            alert(response.data.message);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please check your OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm render form cho từng bước
    const renderStep = () => {
        switch (step) {
            case 1: // Form nhập Email
                return (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative mt-1">
                                <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    required placeholder="you@example.com"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-semibold transition-colors">
                            {isLoading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                );
            case 2: // Form nhập OTP
                return (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label htmlFor="otp" className="text-sm font-medium text-gray-700">Verification Code</label>
                            <div className="relative mt-1">
                                <LuShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)}
                                    required placeholder="Enter the 6-digit code"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 font-semibold transition-colors">
                            Verify Code
                        </button>
                    </form>
                );
            case 3: // Form nhập Mật khẩu mới
                return (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative mt-1">
                                <LuKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                    required placeholder="Enter your new password"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-semibold transition-colors">
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                {/* Tiêu đề và mô tả động */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {step === 1 && 'Forgot Password'}
                        {step === 2 && 'Check Your Email'}
                        {step === 3 && 'Set New Password'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {step === 1 && "We'll send a verification code to your email."}
                        {step === 2 && `We've sent a code to ${email}.`}
                        {step === 3 && "Create a new, strong password."}
                    </p>
                </div>

                {/* Hiển thị thông báo thành công/lỗi */}
                {message && step === 2 && <p className="text-sm text-center text-green-600 bg-green-50 p-3 rounded-md">{message}</p>}
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                {/* Render form tương ứng với bước hiện tại */}
                {renderStep()}
                
                <div className="text-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;