import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import Layout from './components/Layout';
import ProfileSelection from './pages/ProfileSelection';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import TicketList from './pages/TicketList';
import DraftsView from './pages/DraftsView';
import PMOPSDashboard from './pages/PMOPSDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TestCAS from './pages/TestCAS';
import Loading from './components/Loading';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  
  if (!user) return <Navigate to="/select-profile" replace />;
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/select-profile" element={
        user ? <Navigate to="/dashboard" replace /> : <ProfileSelection />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="drafts" element={
          <ProtectedRoute allowedRoles={['PM_OPS', 'ADMIN']}>
            <DraftsView />
          </ProtectedRoute>
        } />
        <Route path="tickets/new" element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN']}>
            <CreateTicket />
          </ProtectedRoute>
        } />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="pm-ops" element={
          <ProtectedRoute allowedRoles={['PM_OPS', 'ADMIN']}>
            <PMOPSDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="test-cas" element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN']}>
            <TestCAS />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;