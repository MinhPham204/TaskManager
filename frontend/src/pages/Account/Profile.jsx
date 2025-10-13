import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from '../../services/authApi';
import { LuUser, LuMail, LuKey, LuSettings2, LuSave, LuX } from 'react-icons/lu';
import { toast } from 'react-hot-toast'; //demo

const Profile = () => {
    const { data: user, isLoading, isError, refetch } = useGetProfileQuery();
    const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });

    // Điền dữ liệu vào form khi user data được tải
    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        }
    }, [user]);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(formData).unwrap();
            toast.success('Profile updated successfully!');
            setIsEditMode(false);
            refetch(); // Yêu cầu tải lại dữ liệu profile
        } catch (err) {
            toast.error(err.data?.message || 'Failed to update profile.');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 6) {
             toast.error('New password must be at least 6 characters long.');
             return;
        }
        try {
            await changePassword(passwordData).unwrap();
            toast.success('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '' }); // Xóa các trường mật khẩu
        } catch (err) {
            toast.error(err.data?.message || 'Failed to change password.');
        }
    };

    if (isLoading) return <DashboardLayout><div>Loading profile...</div></DashboardLayout>;
    if (isError) return <DashboardLayout><div>Failed to load profile.</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Cột Avatar */}
                    <div className="md:col-span-1 flex flex-col items-center">
                        <img
                            className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-200"
                            src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                        />
                         <button className="text-sm text-blue-600 hover:underline">Change Photo</button>
                    </div>

                    {/* Cột thông tin và mật khẩu */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Form thông tin cá nhân */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                            <form onSubmit={handleProfileUpdate}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-700">Personal Information</h3>
                                    {!isEditMode && (
                                        <button type="button" onClick={() => setIsEditMode(true)} className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                                            <LuSettings2 /> Edit
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleFormChange} disabled={!isEditMode}
                                            className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 disabled:bg-gray-100" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleFormChange} disabled={!isEditMode}
                                            className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 disabled:bg-gray-100" />
                                    </div>
                                </div>
                                {isEditMode && (
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setIsEditMode(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                                        <button type="submit" disabled={isUpdatingProfile} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                                            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                        
                        {/* Form đổi mật khẩu */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                             <h3 className="text-xl font-semibold text-gray-700 mb-4">Change Password</h3>
                             <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Current Password</label>
                                    <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required
                                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">New Password</label>
                                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required
                                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" disabled={isChangingPassword} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                                         {isChangingPassword ? 'Saving...' : 'Change Password'}
                                    </button>
                                </div>
                             </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;