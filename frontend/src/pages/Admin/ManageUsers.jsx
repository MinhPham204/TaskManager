import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useGetUsersQuery } from '../../services/userApi';
import { LuPlus } from 'react-icons/lu';
import UserTable from '../../components/UserTable'; 
import InviteUserModal from '../../components/InviteUserModal'; 

const ManageUsers = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: users, isLoading, isError } = useGetUsersQuery();

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Team Members</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        <LuPlus className="w-5 h-5" />
                        Invite User
                    </button>
                </div>

                {/* Body Content */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    {isLoading && <p>Loading members...</p>}
                    {isError && <p className="text-red-500">Failed to load members.</p>}
                    {users && <UserTable users={users} />}
                </div>
            </div>

            {/* Modal mời thành viên */}
            <InviteUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </DashboardLayout>
    );
};

export default ManageUsers;