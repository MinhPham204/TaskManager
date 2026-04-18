import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Breadcrumb from '../../components/Breadcrumb';
import TeamList from '../../components/TeamList';
import TeamDetails from '../../components/TeamDetails';
import { useSelector } from 'react-redux';
import { useGetMyTeamDetailsQuery } from '../../services/teamApi';

const MyTeams = () => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { user: authData } = useSelector((state) => state.auth);
  const { data: teams, isLoading, isError } = useGetMyTeamDetailsQuery();

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
  };

  const handleBackToList = () => {
    setSelectedTeam(null);
  };

  // Get team list (handle both array and single object responses)
  const teamList = Array.isArray(teams) ? teams : (teams ? [teams] : []);

  const breadcrumbItems = selectedTeam
    ? [
        { label: 'Dashboard', href: '/user/dashboard' },
        { label: 'My Teams', href: '/user/my-team' },
        { label: selectedTeam.name },
      ]
    : [
        { label: 'Dashboard', href: '/user/dashboard' },
        { label: 'My Teams' },
      ];

  return (
    <DashboardLayout activeMenu="Teams">
      <div className="my-5">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {selectedTeam ? selectedTeam.name : 'My Teams'}
          </h1>
          <p className="text-gray-600 mt-2">
            {selectedTeam
              ? 'View team members and collaborate'
              : 'Teams you are a member of'}
          </p>
        </div>

        {/* Loading / Error states */}
        {isLoading && (
          <div className="bg-white p-8 rounded-lg text-center">
            <p className="text-gray-500">Loading teams...</p>
          </div>
        )}
        {isError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-600">Failed to load teams.</p>
          </div>
        )}

        {/* Main content */}
        {!isLoading && !isError && (
          <>
            {selectedTeam ? (
              // Team Details View
              <TeamDetails
                team={selectedTeam}
                onBack={handleBackToList}
                authData={authData}
              />
            ) : (
              // Team List View
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Teams ({teamList.length})
                </h2>
                <TeamList
                  teams={teamList}
                  onSelectTeam={handleSelectTeam}
                  isLoading={isLoading}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTeams;