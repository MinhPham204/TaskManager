import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAcceptInvitationMutation } from '../../services/teamApi';

// Component Loading 
const LoadingSpinner = () => (
  <div className="text-center p-10">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    <p className="mt-4 text-lg font-semibold">Processing your invitation...</p>
  </div>
);

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const token = searchParams.get('token');

  const { userInfo } = useSelector((state) => state.auth);
  const [acceptInvitation, { isLoading, isSuccess, isError, error }] = useAcceptInvitationMutation();

  const [message, setMessage] = useState('');

  // Step 1: Check token and login status
  useEffect(() => {
    if (!token) {
      setMessage('Invalid or missing invitation link.');
      return;
    }

    const localToken = localStorage.getItem("token");

    if (!userInfo && !localToken) {
      const currentUrl = `${location.pathname}${location.search}`;
      navigate(`/login?from=${encodeURIComponent(currentUrl)}`, { replace: true });
      return;
    }

    if (userInfo || localToken) {
      const handleAcceptInvite = async () => {
        try {
          await acceptInvitation({ token }).unwrap();
        } catch (err) {
          /* eslint-disable-next-line no-empty */
        }
      };
      handleAcceptInvite();
    }
  }, [token, userInfo, navigate, location, acceptInvitation]);

  // Step 2: Handle invitation result and redirect
  useEffect(() => {
    if (isSuccess) {
      setMessage('Successfully joined the team! Redirecting you shortly...');
      setTimeout(() => {
        navigate('/dashboard/team', { replace: true });
      }, 2000);
    }

    if (isError) {
      setMessage(`Error: ${error.data?.message || 'Failed to join the team.'}`);
    }
  }, [isSuccess, isError, error, navigate]);

  // Optional: Show loading while processing
  if (isLoading) return <LoadingSpinner />;

    // Giao diện
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-xl max-w-md text-center">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-4">Accept Invitation</h2>
                        <p className="text-gray-700">{message}</p>
                        {isError && (
                            <button 
                                onClick={() => navigate('/login', { replace: true })}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Try Again
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvitePage;