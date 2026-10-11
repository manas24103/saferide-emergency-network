import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';

import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

import { DashboardPage } from '../pages/DashboardPage';
import { ActiveEmergenciesPage } from '../pages/ActiveEmergenciesPage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { VehicleDetailPage } from '../pages/VehicleDetailPage';
import { DevicesPage } from '../pages/DevicesPage';
import { LiveMapPage } from '../pages/LiveMapPage';
import { EmergencyHistoryPage } from '../pages/EmergencyHistoryPage';
import { SimulatorPage } from '../pages/SimulatorPage';
import { UsersPage } from '../pages/UsersPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { SystemStatusPage } from '../pages/SystemStatusPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Mission Control Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="emergencies" element={<ActiveEmergenciesPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="map" element={<LiveMapPage />} />
        <Route path="history" element={<EmergencyHistoryPage />} />
        <Route path="simulator" element={<SimulatorPage />} />

        {/* Admin and Operator Protected Routes */}
        <Route
          path="audit-logs"
          element={
            <RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR']}>
              <AuditLogsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <UsersPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="system-status" element={<SystemStatusPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
