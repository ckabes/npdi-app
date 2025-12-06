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
import MongoDBExplorer from './pages/MongoDBExplorer';
import TemplateManager from './pages/TemplateManager';
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

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  // PM_OPS and ADMIN users go to PMOps Dashboard
  if (user?.role === 'PM_OPS' || user?.role === 'ADMIN') {
    return <Navigate to="/pm-ops" replace />;
  }

  // Product Managers go to PM Dashboard
  return <Navigate to="/dashboard" replace />;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/select-profile" element={
        user ? <RoleBasedRedirect /> : <ProfileSelection />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<RoleBasedRedirect />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="drafts" element={
          <ProtectedRoute allowedRoles={['PM_OPS', 'ADMIN']}>
            <DraftsView />
          </ProtectedRoute>
        } />
        <Route path="tickets/new" element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER', 'ADMIN']}>
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
        <Route path="mongodb" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MongoDBExplorer />
          </ProtectedRoute>
        } />
        <Route path="templates" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <TemplateManager />
          </ProtectedRoute>
        } />
        <Route path="test-cas" element={
          <ProtectedRoute allowedRoles={['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN']}>
            <TestCAS />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
  );
}

export default App;