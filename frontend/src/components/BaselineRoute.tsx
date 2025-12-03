import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

interface BaselineRouteProps {
  children: JSX.Element;
}

const BaselineRoute: React.FC<BaselineRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [baselineDone, setBaselineDone] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBaseline = async () => {
      try {
        const profile = await api.getProfile();
        setBaselineDone(profile.baselineDone || false);
      } catch (error) {
        console.error('Error checking baseline status:', error);
        setBaselineDone(false);
      } finally {
        setLoading(false);
      }
    };

    checkBaseline();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5FF] dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]"></div>
      </div>
    );
  }

  // If baseline is not done, redirect to baseline test
  if (!baselineDone) {
    return <Navigate to="/baseline-test" replace />;
  }

  return children;
};

export default BaselineRoute;
