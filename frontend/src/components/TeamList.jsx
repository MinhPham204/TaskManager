import React from 'react';
import { LuArrowRight, LuUsers } from 'react-icons/lu';

/**
 * TeamList Component - Displays list of teams
 * @param {Array} teams - Array of team objects
 * @param {Function} onSelectTeam - Callback when team is selected
 * @param {boolean} isLoading - Loading state
 */
const TeamList = ({ teams = [], onSelectTeam, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-gray-500">Loading teams...</p>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">
          No teams found. Create or join a team to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => {
        const memberCount = team.members?.length || 0;
        
        return (
          <div
            key={team._id}
            onClick={() => onSelectTeam(team)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Team name */}
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {team.name}
                </h3>
                
                {/* Description */}
                {team.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Team stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <LuUsers className="w-3 h-3" />
                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="ml-4 flex items-center text-blue-600">
                <LuArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamList;
