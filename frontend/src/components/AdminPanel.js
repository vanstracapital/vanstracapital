import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const { userRole, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [statusModalTarget, setStatusModalTarget] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [verificationCodes, setVerificationCodes] = useState({});
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditEntries, setAuditEntries] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState(null);

  const statusActions = [
    { key: 'frozen', label: 'Freeze', className: 'ban-btn' },
    { key: 'suspended', label: 'Suspend', className: 'ban-btn' },
    { key: 'blocked', label: 'Block', className: 'ban-btn' },
    { key: 'locked', label: 'Disable', className: 'ban-btn' },
  ];

  const openStatusModal = (user, status) => {
    setStatusModalUser(user);
    setStatusModalTarget(status);
    setVerificationCode('');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusModalUser(null);
    setStatusModalTarget('');
    setVerificationCode('');
  };

  const openCodesModal = async () => {
    try {
      const res = await api.get('/admin/verification-codes');
      setVerificationCodes(res.data.codes || {});
      setShowCodesModal(true);
    } catch (err) {
      alert('Failed to load verification codes.');
    }
  };

  const closeCodesModal = () => {
    setShowCodesModal(false);
  };

  const openAuditModal = async () => {
    try {
      const res = await api.get('/admin/audit');
      setAuditEntries(res.data.audits || []);
      setShowAuditModal(true);
    } catch (err) {
      alert('Failed to load audit log.');
    }
  };

  const closeAuditModal = () => {
    setShowAuditModal(false);
    setAuditEntries([]);
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  // Redirect if not admin
  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  // Fetch users and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, statsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/stats'),
        ]);
        setUsers(usersRes.data.users || []);
        setStats(statsRes.data.stats || {});
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openTopupModal = (userId) => {
    setSelectedUserId(userId);
    setTopupAmount('');
    setShowTopupModal(true);
  };

  const closeTopupModal = () => {
    setShowTopupModal(false);
    setSelectedUserId(null);
    setTopupAmount('');
  };

  const handleTopup = async () => {
    if (!topupAmount || topupAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const amount = parseFloat(topupAmount);
      const user = users.find((u) => u.id === selectedUserId);
      const newBalance = user.accountBalance + amount;

      await api.put(`/admin/users/${selectedUserId}/balance`, {
        balance: newBalance,
      });

      setUsers(
        users.map((u) =>
          u.id === selectedUserId ? { ...u, accountBalance: newBalance } : u
        )
      );

      alert(`Successfully topped up €${amount.toFixed(2)} for ${user.fullName}`);
      closeTopupModal();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || 'Failed to top up'}`);
    }
  };

  const handleStatusChange = async () => {
    if (!statusModalUser || !statusModalTarget) {
      return;
    }

    try {
      const payload = { status: statusModalTarget };
      if (['frozen', 'suspended', 'blocked', 'locked'].includes(statusModalTarget)) {
        if (!verificationCode) {
          alert('Please enter the verification code for this action.');
          return;
        }
        payload.verificationCode = verificationCode;
      }

      await api.put(`/admin/users/${statusModalUser.id}/status`, payload);

      setUsers(
        users.map((u) =>
          u.id === statusModalUser.id ? { ...u, accountStatus: statusModalTarget } : u
        )
      );

      alert(`Account status changed to: ${statusModalTarget}`);
      closeStatusModal();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || 'Failed to change status'}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="admin-container"><p className="loading">Loading...</p></div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="confirm-btn" onClick={openCodesModal}>
            View Verification Codes
          </button>
          <button className="confirm-btn" onClick={openAuditModal}>
            View Audit Log
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Online Users</div>
            <div className="stat-value">{stats.onlineUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value">€{(stats.totalBalance || 0).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Blocked Accounts</div>
            <div className="stat-value">{stats.blockedAccounts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Banned Accounts</div>
            <div className="stat-value">{stats.bannedAccounts || 0}</div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Users Table */}
      <div className="table-section">
        <h2>User Management</h2>
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Full Name</th>
                <th>Balance (€)</th>
                <th>Account Status</th>
                <th>Online</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={`status-${user.accountStatus}`}>
                    <td>{user.email}</td>
                    <td>{user.fullName}</td>
                    <td className="balance">€{user.accountBalance.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${user.accountStatus}`}>
                        {user.accountStatus}
                      </span>
                    </td>
                    <td>{user.isOnline ? '🟢 Yes' : '🔴 No'}</td>
                    <td>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="actions">
                      <button
                        className="action-btn topup-btn"
                        onClick={() => openTopupModal(user.id)}
                        title="Top up balance"
                      >
                        💰 Top Up
                      </button>
                      <button
                        className="action-btn confirm-btn"
                        onClick={() => openUserModal(user)}
                        title="View user details"
                      >
                        👁️ View
                      </button>
                      {statusActions.map((action) => (
                        <button
                          key={action.key}
                          className={`action-btn ${action.className}`}
                          onClick={() => openStatusModal(user, action.key)}
                          title={`${action.label} user account`}
                          disabled={user.accountStatus === action.key}
                        >
                          {action.label}
                        </button>
                      ))}
                      {user.accountStatus === 'banned' && (
                        <button
                          className="action-btn unblock-btn"
                          onClick={() => openStatusModal(user, 'active')}
                          title="Unban user"
                        >
                          ✅ Unban
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopupModal && (
        <div className="modal-overlay" onClick={closeTopupModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Top Up Balance</h2>
              <button className="close-btn" onClick={closeTopupModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Enter the amount to add to{' '}
                <strong>
                  {users.find((u) => u.id === selectedUserId)?.fullName}
                </strong>
                's account
              </p>
              <input
                type="number"
                placeholder="Amount (€)"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="modal-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeTopupModal}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleTopup}>
                Confirm Top Up
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && statusModalUser && (
        <div className="modal-overlay" onClick={closeStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{`Confirm ${statusModalTarget} Action`}</h2>
              <button className="close-btn" onClick={closeStatusModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                This action will set <strong>{statusModalUser.fullName}</strong>'s account to <strong>{statusModalTarget}</strong>.
              </p>
              {['frozen', 'suspended', 'blocked', 'locked'].includes(statusModalTarget) && (
                <>
                  <p>
                    Enter the secure verification code for this administrative action.
                  </p>
                  <input
                    type="text"
                    placeholder="Verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="modal-input"
                  />
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeStatusModal}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleStatusChange}>
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {showCodesModal && (
        <div className="modal-overlay" onClick={closeCodesModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Admin Verification Codes</h2>
              <button className="close-btn" onClick={closeCodesModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>These codes are for admin-only verification when changing account status.</p>
              <ul style={{ paddingLeft: '18px', color: '#333' }}>
                {Object.entries(verificationCodes).map(([status, label]) => (
                  <li key={status} style={{ marginBottom: '8px' }}>
                    <strong>{status.toUpperCase()}</strong>: {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button className="confirm-btn" onClick={closeCodesModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
        <div className="modal-overlay" onClick={closeAuditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Audit Log</h2>
              <button className="close-btn" onClick={closeAuditModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {auditEntries.length === 0 ? (
                <p>No audit entries found.</p>
              ) : (
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Time</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Admin</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Action</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Target</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                            {entry.adminEmail}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                            {entry.action}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                            {entry.targetUserId}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                            {entry.details ? JSON.stringify(entry.details) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="confirm-btn" onClick={closeAuditModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={closeUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser.fullName}'s Account</h2>
              <button className="close-btn" onClick={closeUserModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Balance:</strong> €{selectedUser.accountBalance.toFixed(2)}</p>
              <p><strong>Status:</strong> {selectedUser.accountStatus}</p>
              <p><strong>Account Number:</strong> {selectedUser.accountNumber || 'N/A'}</p>
              <p><strong>Tier:</strong> {selectedUser.tier || 'Standard'}</p>
              <div style={{ marginTop: '20px' }}>
                <h3>Transaction History</h3>
                {selectedUser.transactions && selectedUser.transactions.length > 0 ? (
                  <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Date</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Type</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Amount</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.transactions.map((tx) => (
                          <tr key={tx.id || `${tx.timestamp}-${tx.amount}`}> 
                            <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                              {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{tx.type || tx.description || 'N/A'}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>€{Math.abs(tx.amount || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{tx.status || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No transactions available for this user.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="confirm-btn" onClick={closeUserModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
