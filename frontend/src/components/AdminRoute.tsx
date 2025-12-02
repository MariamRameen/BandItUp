import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user: User = JSON.parse(userStr);
    
    if (user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;