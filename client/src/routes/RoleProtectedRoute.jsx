import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user || !allowedRoles.includes(role)) {
    return (
      <div className="p-8 text-center font-mono text-slate-300">
        <div className="text-red-400 font-bold text-lg mb-2">ACCESS RESTRICTED [403 FORBIDDEN]</div>
        <div className="text-xs text-slate-400 max-w-md mx-auto">
          Your role ({role || 'NONE'}) is not authorized to access this module. Please contact Mission Commander.
        </div>
      </div>
    );
  }

  return children;
};
