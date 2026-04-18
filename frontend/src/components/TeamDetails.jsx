import React, { useState } from 'react';
import { LuArrowLeft, LuPlus } from 'react-icons/lu';
import UserTable from './UserTable';
import InviteUserModal from './InviteUserModal';

/**
 * TeamDetails Component - Shows team info + members
 * @param {Object} team - Team object with members
 * @param {Function} onBack - Callback to go back to team list
 * @param {Object} authData - Current user auth data
 */
const TeamDetails = ({ team, onBack, authData }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  if (!team) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Team not found</p>
      </div>
    );
  }

  const canInvite = ['owner', 'admin'].includes(authData?.role);

  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to teams"
        >
          <LuArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-800">{team.name}</h2>
          {team.description && (
            <p className="text-sm text-gray-600 mt-1">{team.description}</p>
          )}
        </div>
      </div>

      {/* Team info card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Members</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {team.members?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
            <p className="text-lg text-gray-800 mt-1">
              {new Date(team.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Organization</p>
            <p className="text-lg text-gray-800 mt-1">
              {team.organization?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
          {canInvite && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              <LuPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>

        <UserTable
          users={team.members || []}
          currentUserRole={authData?.role}
          currentUserId={authData?._id}
        />
      </div>

      {/* Invite modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

export default TeamDetails;
