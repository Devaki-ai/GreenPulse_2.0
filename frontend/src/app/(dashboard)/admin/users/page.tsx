'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { User } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, UserCheck, UserX, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.data);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter, page]);

  const handleToggleStatus = async (userId: string, name: string) => {
    try {
      const { data } = await api.patch(`/users/${userId}/toggle-status`);
      toast.success(`${name} ${data.data.isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success(`${name} deleted`);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const roleBadge: Record<string, 'green' | 'blue' | 'purple'> = {
    farmer: 'green', buyer: 'blue', admin: 'purple',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-500 mt-1">{total} total users</p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input py-2 text-sm w-auto" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="farmer">Farmers</option>
            <option value="buyer">Buyers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      {loading ? <PageLoader /> : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {['User', 'Role', 'Location', 'Joined', 'Last Login', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={roleBadge[user.role] || 'gray'} className="capitalize">{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {[user.location?.district, user.location?.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {user.lastLogin ? timeAgo(user.lastLogin) : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.isActive ? 'green' : 'red'} dot>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.name)}
                          className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="secondary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
