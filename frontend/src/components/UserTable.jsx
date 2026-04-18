import React, { useMemo } from 'react'; 
import { LuTrash2 } from 'react-icons/lu';
import { useRemoveMemberMutation } from '../services/teamApi';

const StatItem = ({ value, label, colorClass }) => (
    <div className="text-center px-2">
        <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
);

/**
 * Kiểm tra quyền xóa thành viên dựa trên RBAC rules từ backend:
 * - Owner: xóa được Admin/Member (không xóa Owner khác)
 * - Admin: xóa được Member (không xóa Admin/Owner)
 * - Member: không xóa ai
 * - Không tự xóa bản thân
 */
const canRemoveMember = (currentUserRole, targetRole, isSelf) => {
    if (isSelf) return false; // Không tự xóa bản thân
    if (targetRole === 'owner') return false; // Không ai xóa được Owner
    if (currentUserRole === 'owner') return ['admin', 'member'].includes(targetRole); // Owner xóa Admin/Member
    if (currentUserRole === 'admin') return targetRole === 'member'; // Admin xóa Member
    return false; // Member không xóa ai
};

const UserTable = ({ users, currentUserRole, currentUserId }) => {
    const [removeMember, { isLoading }] = useRemoveMemberMutation();

    const sortedUsers = useMemo(() => {
        if (!users) return [];
        // users có thể là array của users trực tiếp hoặc array của { user, role } objects
        // Normalize thành format: [{ _id, name, email, role, profileImageUrl, ... }]
        return [...users]
            .map((item) => {
                // Nếu item có property 'user', nó là format { user, role }
                if (item.user && item.role) {
                    return { ...item.user, role: item.role };
                }
                // Ngược lại, item là user object trực tiếp
                return item;
            })
            .sort((a, b) => {
                const roleOrder = { owner: 0, admin: 1, member: 2 };
                return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
            });
        }, [users]);

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
                {sortedUsers.map((user) => {
                    const isSelf = user._id === currentUserId;
                    const canDelete = canRemoveMember(currentUserRole, user.role, isSelf);
                    
                    return (
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
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.role === 'owner' 
                                        ? 'bg-purple-100 text-purple-800' 
                                        : user.role === 'admin' 
                                        ? 'bg-indigo-100 text-indigo-800' 
                                        : 'bg-green-100 text-green-800'
                                }`}>
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
                                {canDelete ? (
                                    <button 
                                        onClick={() => handleRemove(user._id)} 
                                        disabled={isLoading} 
                                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 cursor-pointer"
                                        title={`Remove ${user.name}`}
                                    >
                                        <LuTrash2 className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <span className="text-gray-300 cursor-not-allowed" title="You don't have permission to remove this member">
                                        <LuTrash2 className="w-5 h-5" />
                                    </span>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default UserTable;