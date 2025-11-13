// src/components/InviteUserModal.js
import React, { useState, useEffect } from 'react';
import { useInviteMemberMutation } from '../services/teamApi';
import { useSearchUsersQuery } from '../services/userApi'; 
import useDebounce from '../hooks/useDebounce'; 

const InviteUserModal = ({ isOpen, onClose }) => {
    // State cho tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null); 
    const [role, setRole] = useState('user'); 

    // State của RTK Query
    const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();
    const debouncedSearchTerm = useDebounce(searchTerm, 500); 

    const { data: searchResults, isLoading: isSearching } = useSearchUsersQuery(
        debouncedSearchTerm,
        {
            skip: !debouncedSearchTerm,
        }
    );

    // Reset state khi modal đóng/mở
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSelectedUser(null);
            setRole('user');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setSearchTerm(user.name); 
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            alert('Please select a user from the search results.');
            return;
        }

        try {
            await inviteMember({ 
                userId: selectedUser._id, 
                role 
            }).unwrap();
            
            alert('Invitation sent successfully!');
            onClose(); 
        } catch (err) {
            alert(err.data?.message || 'Failed to send invitation.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            
            {/* Thêm 'relative' vào đây để định vị nút 'X' */}
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            
            {/* Thêm nút 'X' (Close) */}
            <button 
                type="button" 
                onClick={onClose} 
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

                <h3 className="text-xl font-semibold mb-4">Invite New Member</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                            <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700">
                                Search User (by Email)
                            </label>
                            <input
                                type="text"
                                id="userSearch"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedUser(null);
                                }}
                                required={!selectedUser}
                                autoComplete="off"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                            
                            {/* Danh sách kết quả tìm kiếm */}
                            {(isSearching || (searchResults && searchResults.length > 0)) && !selectedUser && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                    {isSearching ? (
                                        <li className="px-4 py-2 text-gray-500">Searching...</li>
                                    ) : (
                                        searchResults?.map((user) => (
                                            <li
                                                key={user._id}
                                                onClick={() => handleSelectUser(user)}
                                                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {user.profileImageUrl ? (
                                                    <img 
                                                        src={user.profileImageUrl} 
                                                        alt={user.name} 
                                                        className="w-10 h-10 rounded-full mr-3 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                                        {user.name[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>

                        {selectedUser && (
                            <>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isInviting || !selectedUser}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {isInviting ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteUserModal;