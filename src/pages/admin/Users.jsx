import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Shield, CheckCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import notificationService from '../../services/notificationService';
import { getAuthUser } from '../../utils/auth';
import userService from '../../services/userService';

const fetchUsers = async () => {
  const baseUsers = await userService.getAllAdminUsers();
  const profileMap = await userService.getBulkProfiles(baseUsers.map((user) => user.userId)).catch(() => ({}));
  return baseUsers.map((user) => ({
    ...user,
    ...(profileMap[user.userId] || {}),
    profilePicUrl: profileMap[user.userId]?.profilePicUrl || user.profilePicUrl || null
  }));
};

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const queryClient = useQueryClient();
  const currentUser = getAuthUser();
  const currentUserId = currentUser?.userId || currentUser?.id;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: fetchUsers,
    staleTime: 300000, // 5 minutes
  });

  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery) {
      const normalizedQuery = searchQuery.toLowerCase();
      result = result.filter((user) =>
        (user.fullName || '').toLowerCase().includes(normalizedQuery) ||
        (user.email || '').toLowerCase().includes(normalizedQuery)
      );
    }

    if (roleFilter !== 'ALL') {
      result = result.filter((user) => user.role === roleFilter);
    }

    return result;
  }, [users, searchQuery, roleFilter]);

  const handleToggleStatus = async (userId, currentStatus) => {
    if (Number(userId) === Number(currentUserId)) {
      toast.warning("Self-suspension is disabled to prevent admin lockout.");
      return;
    }
    try {
      await api.put(`/auth/admin/users/${userId}/status?active=${!currentStatus}`);
      const updatedUser = users.find((user) => user.userId === userId);

      queryClient.setQueryData(['adminUsers'], (prev = []) =>
        prev.map((user) => (user.userId === userId ? { ...user, active: !currentStatus } : user))
      );

      if (updatedUser?.email) {
        notificationService.sendNotification({
          userId,
          type: !currentStatus ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_SUSPENDED',
          title: !currentStatus ? 'Account Reactivated' : 'Account Suspended',
          message: !currentStatus
            ? 'Your account has been reactivated. You can log in again with your usual credentials.'
            : 'Your account has been suspended. You will not be able to access the platform until an administrator reactivates it.',
          relatedEntityId: userId,
          relatedEntityType: 'USER',
          targetEmail: updatedUser.email
        }).catch(() => {});
      }

      toast.success(`User ${!currentStatus ? 'activated' : 'suspended'} successfully.`);
    } catch {
      toast.error('Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (Number(userId) === Number(currentUserId)) {
      toast.warning("Self-deletion is disabled from the user management panel.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
      await api.delete(`/api/v1/admin/users/${userId}`);
      queryClient.setQueryData(['adminUsers'], (prev = []) => prev.filter((user) => user.userId !== userId));
      toast.success('User deleted successfully.');
    } catch {
      toast.error('Failed to delete user.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (Number(userId) === Number(currentUserId)) {
      toast.warning("You cannot change your own role to prevent losing admin access.");
      return;
    }
    try {
      await api.put(`/auth/admin/users/${userId}/role?role=${newRole}`);
      queryClient.setQueryData(['adminUsers'], (prev = []) =>
        prev.map((user) => (user.userId === userId ? { ...user, role: newRole } : user))
      );
      toast.success(`User role updated to ${newRole}.`);
    } catch {
      toast.error('Failed to update user role.');
    }
  };

  const renderAvatar = (user) => {
    if (user.profilePicUrl) {
      return (
        <img
          src={user.profilePicUrl}
          alt={user.fullName || user.email || 'User'}
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      );
    }

    return (
      <div
        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--page-primary), var(--page-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900, color: 'white' }}
      >
        {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
      </div>
    );
  };

  return (
    <div className="admin-users" style={{ maxWidth: '100%', margin: '0', padding: '0 4vw 5rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '2rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.03em' }}>
            User <span className="text-gradient">Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Manage system users, roles, access, and identity details.
          </p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="glass-input"
            style={{ paddingLeft: '3rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="glass-input" style={{ width: '200px' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="INSTRUCTOR">Instructors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <th style={{ padding: '1.25rem' }}>User Identity</th>
                <th style={{ padding: '1.25rem' }}>Access Role</th>
                <th style={{ padding: '1.25rem' }}>Join Date</th>
                <th style={{ padding: '1.25rem' }}>Nexus Status</th>
                <th style={{ padding: '1.25rem' }}>Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No entities matched the current search sequence.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow 
                    key={user.userId} 
                    user={user} 
                    currentUserId={currentUserId} 
                    onToggleStatus={handleToggleStatus} 
                    onDelete={handleDeleteUser} 
                    onRoleChange={handleRoleChange} 
                    renderAvatar={renderAvatar}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const UserRow = React.memo(({ user, currentUserId, onToggleStatus, onDelete, onRoleChange, renderAvatar }) => (
  <tr style={{ borderTop: '1px solid var(--border-color)', transition: 'background-color 0.2s ease' }}>
    <td style={{ padding: '1.25rem' }}>
      <Link to={`/admin/profile/${user.userId}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
        {renderAvatar(user)}
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user.fullName || 'Identity Pending'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
        </div>
      </Link>
    </td>
    <td style={{ padding: '1.25rem' }}>
      {Number(user.userId) === Number(currentUserId) ? (
        <span style={{ fontWeight: 900, color: 'var(--page-primary)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{user.role} (YOU)</span>
      ) : (
        <select value={user.role} onChange={(e) => onRoleChange(user.userId, e.target.value)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>
          <option value="STUDENT">STUDENT</option>
          <option value="INSTRUCTOR">INSTRUCTOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      )}
    </td>
    <td style={{ padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Nexus Origin'}
    </td>
    <td style={{ padding: '1.25rem' }}>
      <span style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 950, letterSpacing: '0.05em', background: user.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: user.active ? '#10b981' : '#ef4444', border: `1px solid ${user.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
        {user.active ? 'ACTIVE' : 'OFFLINE'}
      </span>
    </td>
    <td style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link to={`/admin/profile/${user.userId}`} className="action-btn" title="View Profile" style={{ color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Eye size={18} />
        </Link>
        {Number(user.userId) !== Number(currentUserId) && (
          <>
            <button onClick={() => onToggleStatus(user.userId, user.active)} className="action-btn" title={user.active ? 'Suspend' : 'Activate'} style={{ color: user.active ? '#f59e0b' : '#10b981' }}>
              {user.active ? <Shield size={18} /> : <CheckCircle size={18} />}
            </button>
            <button onClick={() => onDelete(user.userId)} className="action-btn" style={{ color: '#ef4444' }} title="Delete">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
));
