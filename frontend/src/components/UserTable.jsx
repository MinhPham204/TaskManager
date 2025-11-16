// src/components/UserTable.jsx

import React, { useMemo } from 'react'; 
import { LuTrash2 } from 'react-icons/lu';
import { useRemoveMemberMutation } from '../services/teamApi';

const StatItem = ({ value, label, colorClass }) => (
    <div className="text-center px-2">
        <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
);

const UserTable = ({ users, currentUserRole, currentUserId }) => {
    const [removeMember, { isLoading }] = useRemoveMemberMutation();

    const sortedUsers = useMemo(() => {
        if (!users) return [];
        return [...users].sort((a, b) => a.role.localeCompare(b.role));
        }, [users]);

    // Hàm handleRemove (không đổi)
    const handleRemove = async (userId) => {
        if (window.confirm('Are you sure you want to remove this member?')) {
            try {
                await removeMember(userId).unwrap();
                alert('Member removed successfully.');
            } catch (err) {
                alert('Failed to remove member.');
            }
        }
    };

    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Status</th>
                    <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                    <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                    <img className="h-10 w-10 rounded-full object-cover" src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-start -ml-2">
                                <StatItem value={user.pendingTasks || 0} label="Pending" colorClass="text-yellow-500" />
                                <StatItem value={user.inProgressTasks || 0} label="In Progress" colorClass="text-blue-500" />
                                <StatItem value={user.completedTasks || 0} label="Completed" colorClass="text-green-500" />
                            </div>
                        </td>

                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {currentUserRole === 'admin' && user._id !== currentUserId && (
                                <button onClick={() => handleRemove(user._id)} disabled={isLoading} className="text-red-600 hover:text-red-900 disabled:text-gray-400">
                                    <LuTrash2 className="w-5 h-5" />
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default UserTable;