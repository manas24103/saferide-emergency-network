import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Shield,
  Search,
  Lock,
  UserX,
  UserCheck,
  Key,
  X,
  Trash2,
} from 'lucide-react';

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CONTROL_ROOM_OPERATOR',
    badgeNumber: '',
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      setCreateModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'CONTROL_ROOM_OPERATOR',
        badgeNumber: '',
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.put(`/users/${user._id}/status`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${targetUser._id}/reset-password`, { newPassword });
      setResetModalOpen(false);
      setNewPassword('');
      alert('Password updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user ${user.name}?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.badgeNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              OPERATOR & PERSONNEL ACCESS CONTROL
            </span>
            <span className="px-2 py-0.5 rounded bg-[#131d2a] text-cyan-400 text-xs border border-[#1f2f44]">
              Super Admin RBAC
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Provision dispatch commanders, control-room operators, and fleet drivers.
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>PROVISION OPERATOR</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">ROLE:</span>
          {['ALL', 'SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR', 'DRIVER'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2 py-1 rounded transition-colors ${
                roleFilter === r
                  ? 'bg-[#1b2b3e] text-cyan-400 font-bold border border-[#2d4766]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search Name or Badge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#0f1722] border border-[#223348] rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-[#182332] bg-[#0c131c] text-slate-400 text-[10px]">
              <th className="py-2.5 px-3">OPERATOR</th>
              <th className="py-2.5 px-3">EMAIL</th>
              <th className="py-2.5 px-3">ROLE</th>
              <th className="py-2.5 px-3">BADGE / ID</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">LAST LOGIN</th>
              <th className="py-2.5 px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131d2a]">
            {filteredUsers.map((u) => (
              <tr key={u._id} className="hover:bg-[#101925] transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-200">{u.name}</td>
                <td className="py-2.5 px-3 text-slate-300">{u.email}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      u.role === 'SUPER_ADMIN'
                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                        : u.role === 'CONTROL_ROOM_OPERATOR'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400">{u.badgeNumber}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'ACTIVE'
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800'
                        : 'text-red-400 bg-red-950/60 border border-red-800'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString() : 'Never'}
                </td>
                <td className="py-2.5 px-3 text-right space-x-1">
                  <button
                    onClick={() => {
                      setTargetUser(u);
                      setResetModalOpen(true);
                    }}
                    title="Reset Password"
                    className="p-1 rounded bg-[#162232] hover:bg-[#20324a] text-slate-300"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  {currentUser?.id !== u._id && (
                    <>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                        className="p-1 rounded bg-[#162232] hover:bg-[#20324a] text-slate-300"
                      >
                        {u.status === 'ACTIVE' ? (
                          <UserX className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Delete User"
                        className="p-1 rounded bg-[#162232] hover:bg-red-950 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e1622] border border-[#223348] rounded-md max-w-md w-full p-4 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2838]">
              <span className="font-bold text-slate-100 uppercase">PROVISION OPERATOR ACCOUNT</span>
              <button onClick={() => setCreateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">NAME:</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">EMAIL:</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">PASSWORD:</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">ROLE:</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                  >
                    <option value="CONTROL_ROOM_OPERATOR">CONTROL ROOM OPERATOR</option>
                    <option value="DRIVER">DRIVER</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">BADGE / UNIT NUMBER:</label>
                  <input
                    type="text"
                    placeholder="e.g. TAC-OP-05"
                    value={newUser.badgeNumber}
                    onChange={(e) => setNewUser({ ...newUser, badgeNumber: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100 uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#15202e] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e1622] border border-[#223348] rounded-md max-w-sm w-full p-4 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2838]">
              <span className="font-bold text-slate-100 uppercase">ADMIN RESET PASSWORD</span>
              <button onClick={() => setResetModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-3">
              <div>
                <span className="text-slate-400">User:</span>{' '}
                <span className="text-cyan-400 font-bold">{targetUser?.name}</span> ({targetUser?.email})
              </div>

              <div>
                <label className="block text-slate-300 mb-1">NEW PASSWORD:</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#15202e] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
