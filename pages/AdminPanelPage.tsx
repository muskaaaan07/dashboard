import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import { ADMIN_AUTH_KEY } from '../components/AdminLogin';

/**
 * Wrapper that checks admin auth and renders AdminPanel or redirects to /admin.
 */
const AdminPanelPage: React.FC = () => {
  const isAdmin = sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <AdminPanel />;
};

export default AdminPanelPage;
