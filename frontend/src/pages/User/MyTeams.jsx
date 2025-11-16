import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useGetUsersQuery } from '../../services/userApi';
import { LuPlus } from 'react-icons/lu';
import UserTable from '../../components/UserTable'; 

const MyTeams = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: users, isLoading, isError } = useGetUsersQuery();

    return (
        <DashboardLayout>
            <div className="my-5">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Team Members</h2>
                </div>

                {/* Body Content */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    {isLoading && <p>Loading members...</p>}
                    {isError && <p className="text-red-500">Failed to load members.</p>}
                    {users && <UserTable users={users} />}
                </div>
            </div>
           
        </DashboardLayout>
    );
};

export default MyTeams;