import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { logout, restricted, banned, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState('Loading...');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // if the user is flagged banned, redirect after a short delay
    if (banned) {
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
      return;
    }

    // if the user is flagged restricted in context, redirect away
    if (restricted) {
      navigate('/account-review');
      return;
    }

    api
      .get('/dashboard')
      .then((res) => setMessage(res.data.message))
      .catch((err) => {
        if (err.response?.status === 403) {
          // Check if it's a banned or restricted status
          if (err.response?.data?.message?.includes('banned')) {
            setMessage('Your account has been banned. Contact support.');
            logout();
            setTimeout(() => navigate('/login'), 2000);
          } else {
            setMessage('Access denied. Account may be restricted.');
          }
        } else {
          setMessage('Unable to load dashboard.');
        }
      });

    // Fetch current user info
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch((err) => console.error('Error fetching user:', err));
  }, [restricted, banned, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAdminPanel = () => {
    if (userRole === 'admin') {
      navigate('/admin');
    }
  };

  if (banned) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
        <h2>Account Banned</h2>
        <p>Your account has been banned. Please contact support.</p>
        <button onClick={handleLogout}>Return to Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      {user && (
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Welcome:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Balance:</strong> €{user.accountBalance?.toFixed(2) || '0.00'}</p>
          <p><strong>Account Status:</strong> {user.accountStatus}</p>
        </div>
      )}
      <p>{message}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        {userRole === 'admin' && (
          <button onClick={handleAdminPanel} style={{ 
            background: '#667eea', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Admin Panel
          </button>
        )}
        <button onClick={handleLogout} style={{ 
          background: '#ef5350', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
