import React, { useState } from 'react';
import { LuCircleCheck, LuCircleX, LuClock, LuBuilding2 } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { useGetPendingInvitationsQuery, useAcceptInvitationMutation } from '../services/organizationApi';

const PendingInvitations = () => {
    const { data: invitationsData, isLoading, refetch } = useGetPendingInvitationsQuery();
    const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation();
    const [expandedOrg, setExpandedOrg] = useState(null);

    const handleAcceptInvitation = async (orgId) => {
        try {
            await acceptInvitation(orgId).unwrap();
            toast.success('Invitation accepted! You are now a member of this organization.');
            refetch();
        } catch (err) {
            toast.error(err.data?.message || 'Failed to accept invitation.');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                    <LuClock className="text-yellow-600 text-2xl" />
                    <h3 className="text-xl font-semibold text-gray-700">Pending Invitations</h3>
                </div>
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-2">Loading invitations...</p>
                </div>
            </div>
        );
    }

    const invitations = invitationsData || [];
    const hasPendingInvitations = Array.isArray(invitations) && invitations.length > 0;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
                <LuClock className="text-yellow-600 text-2xl" />
                <h3 className="text-xl font-semibold text-gray-700">Pending Invitations</h3>
                {hasPendingInvitations && (
                    <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {invitations.length} {invitations.length === 1 ? 'invite' : 'invites'}
                    </span>
                )}
            </div>

            {!hasPendingInvitations ? (
                <div className="text-center py-8 text-gray-500">
                    <LuBuilding2 className="mx-auto text-4xl mb-2 text-gray-300" />
                    <p>No pending invitations at the moment.</p>
                    <p className="text-sm mt-1">You'll be notified when you receive an invitation to join an organization.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {invitations.map((org) => (
                        <div key={org._id} className="border border-yellow-200 bg-yellow-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            {/* Header */}
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandedOrg(expandedOrg === org._id ? null : org._id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {org.logoUrl ? (
                                            <img
                                                src={org.logoUrl}
                                                alt={org.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-yellow-200 flex items-center justify-center">
                                                <LuBuilding2 className="text-yellow-700 text-xl" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-gray-800">{org.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                Invited by <span className="font-medium">{org.owner?.name || 'Unknown'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            {org.pendingInvitations?.[0]?.invitedAt
                                                ? new Date(org.pendingInvitations[0].invitedAt).toLocaleDateString()
                                                : 'Recently'}
                                        </p>
                                        <span className="text-sm font-semibold text-yellow-700">⏳ Pending</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrg === org._id && (
                                <div className="border-t border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
                                    <div className="mb-4">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Invitation Details</h5>
                                        <div className="bg-white rounded p-3 text-sm text-gray-600 space-y-1">
                                            <p>
                                                <span className="font-medium">Organization:</span> {org.name}
                                            </p>
                                            <p>
                                                <span className="font-medium">Invited by:</span> {org.owner?.name || 'Unknown'}
                                                {org.owner?.email && <span className="text-gray-500"> ({org.owner.email})</span>}
                                            </p>
                                            <p>
                                                <span className="font-medium">Role:</span>{' '}
                                                <span className="capitalize">{org.pendingInvitations?.[0]?.role || 'Member'}</span>
                                            </p>
                                            <p>
                                                <span className="font-medium">Status:</span>{' '}
                                                <span className="text-yellow-700 font-medium">⏳ Pending your acceptance</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAcceptInvitation(org._id)}
                                            disabled={isAccepting}
                                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                        >
                                            <LuCircleCheck /> Accept Invitation
                                        </button>
                                        <button
                                            onClick={() => setExpandedOrg(null)}
                                            className="flex-1 flex items-center justify-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                                        >
                                            <LuCircleX /> Dismiss
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingInvitations;
