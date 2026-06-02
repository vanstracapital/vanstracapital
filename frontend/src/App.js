import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AccountReview from './pages/AccountReview';
import Dashboard from './pages/Dashboard';
import AdminPanel from './components/AdminPanel';
import { AuthContext } from './context/AuthContext';

const App = () => {
  const { token, restricted, banned, userRole } = useContext(AuthContext);

  const PrivateRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" />;
    }
    if (banned) {
      // if banned, show a message and prevent access
      return <Navigate to="/login" />;
    }
    if (restricted) {
      // if restricted, always send to account review instead of any protected page
      return <Navigate to="/account-review" />;
    }
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" />;
    }
    if (userRole !== 'admin') {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/account-review"
        element={token ? <AccountReview /> : <Navigate to="/login" />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
