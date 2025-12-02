import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader';
import { User, AdminStats } from '../../types/index';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    adminUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    newUsers: 0,
    academicUsers: 0,
    generalUsers: 0,
    verifiedUsers: 0,
    activeToday: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const navigate = useNavigate();

 
  const checkAdmin = (): boolean => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return false;
      }
      
      const user = JSON.parse(userStr) as User;
      if (user.role !== 'admin') {
        navigate('/dashboard');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking admin:', error);
      return false;
    }
  };

  // Fetch admin data
  const fetchAdminData = async (): Promise<void> => {
    try {
      if (!checkAdmin()) return;
      
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
     
      const usersResponse = await fetch('http://localhost:4000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }
      
      const usersData = await usersResponse.json();
      console.log('Users data:', usersData); // Debug log
      
      if (usersData.success && usersData.users) {
        setUsers(usersData.users);
        setFilteredUsers(usersData.users);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
      
      // Fetch stats
      const statsResponse = await fetch('http://localhost:4000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data:', statsData); 
        
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      }
      
    } catch (error) {
      console.error('Admin data error:', error);
      alert('Failed to load admin data. Please login again.');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = [...users];
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.displayName?.toLowerCase() || '').includes(term) ||
        (user.email?.toLowerCase() || '').includes(term)
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Subscription filter
    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(user => user.subscriptionStatus === subscriptionFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, subscriptionFilter]);

  const handleUpdateRole = async (userId: string, currentRole: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to change this user's role?`)) return;
    
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication required');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`User role updated to ${newRole}`);
        fetchAdminData(); // Refresh
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Update role error:', error);
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Authentication required');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('User deleted successfully');
        fetchAdminData(); // Refresh
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Failed to delete user');
    }
  };

  const handleLogout = (): void => {
    localStorage.clear();
    navigate('/login');
  };

  const exportCSV = (): void => {
    if (users.length === 0) {
      alert('No users to export');
      return;
    }
    
    const headers = ['Name', 'Email', 'Role', 'Exam Type', 'Target Score', 'Subscription', 'Verified', 'Joined'];
    const csvData = users.map(user => [
      `"${user.displayName || ''}"`,
      `"${user.email}"`,
      user.role,
      user.examType || 'Academic',
      user.targetScore || '6.5',
      user.subscriptionStatus,
      user.isVerified ? 'Yes' : 'No',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    
    const csv = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banditup-users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
     
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage all users and platform analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              📥 Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {(['overview', 'users', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? '📊 Overview' : 
               tab === 'users' ? '👥 User Management' : 
               '📈 Analytics'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'purple', icon: '👥' },
                { label: 'Admins', value: stats.adminUsers, color: 'blue', icon: '👑' },
                { label: 'Premium Users', value: stats.premiumUsers, color: 'green', icon: '⭐' },
                { label: 'New Users (30d)', value: stats.newUsers, color: 'orange', icon: '🆕' },
                { label: 'Active Today', value: stats.activeToday, color: 'teal', icon: '⚡' },
                { label: 'Verified Users', value: stats.verifiedUsers, color: 'indigo', icon: '✓' },
                { label: 'Academic', value: stats.academicUsers, color: 'red', icon: '📚' },
                { label: 'General', value: stats.generalUsers, color: 'yellow', icon: '🌐' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      stat.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      stat.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      stat.color === 'green' ? 'bg-green-100 text-green-800' :
                      stat.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      stat.color === 'teal' ? 'bg-teal-100 text-teal-800' :
                      stat.color === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                      stat.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Users Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Recent Users</h3>
                <button 
                  onClick={() => setActiveTab('users')}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  View All →
                </button>
              </div>
              
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3">Name</th>
                        <th className="text-left py-3">Email</th>
                        <th className="text-left py-3">Role</th>
                        <th className="text-left py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map((user: User) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 font-medium">
                            <div className="flex items-center gap-2">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-800">
                                  {user.displayName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {user.displayName}
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{user.email}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Subscription Distribution</h3>
                {stats.totalUsers > 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-8 border-green-500"></div>
                        <div 
                          className="absolute inset-0 rounded-full border-8 border-purple-500" 
                          style={{ 
                            clipPath: `inset(0 ${100 - (stats.premiumUsers / stats.totalUsers * 100)}% 0 0)` 
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{stats.totalUsers}</span>
                        </div>
                      </div>
                      <div className="flex justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Free: {stats.freeUsers}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span>Premium: {stats.premiumUsers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No data available</div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Exam Type Distribution</h3>
                {stats.totalUsers > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Academic</span>
                        <span className="font-semibold">
                          {stats.academicUsers} ({Math.round(stats.academicUsers / stats.totalUsers * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(stats.academicUsers / stats.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>General Training</span>
                        <span className="font-semibold">
                          {stats.generalUsers} ({Math.round(stats.generalUsers / stats.totalUsers * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(stats.generalUsers / stats.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No data available</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border">
            {/* Filters */}
            <div className="p-6 border-b">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    value={subscriptionFilter}
                    onChange={(e) => setSubscriptionFilter(e.target.value)}
                  >
                    <option value="all">All Subscriptions</option>
                    <option value="free_trial">Free Trial</option>
                    <option value="active">Active</option>
                    <option value="premium">Premium</option>
                    <option value="admin">Admin</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {/* Users Table */}
            {filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Details</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: User) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-800 font-semibold">
                                {user.displayName?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="text-gray-500">Exam:</span> {user.examType || 'Academic'}
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Target:</span> {user.targetScore || '6.5'}
                            </p>
                            <p className="text-sm">
                              <span className="text-gray-500">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                            <br />
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              user.subscriptionStatus === 'admin' 
                                ? 'bg-gray-800 text-white' :
                                user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'active'
                                ? 'bg-green-100 text-green-800' 
                                : user.subscriptionStatus === 'free_trial'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.subscriptionStatus}
                            </span>
                            <br />
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              user.isVerified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.isVerified ? 'Verified' : 'Not Verified'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleUpdateRole(user._id, user.role)}
                              className={`px-3 py-1 rounded text-sm ${
                                user.role === 'admin'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user._id, user.displayName)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                              >
                                Delete User
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No users found matching your filters.
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">User Growth</h3>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">User growth chart will appear here</p>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Activity Overview</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Daily Active Users</p>
                    <p className="text-2xl font-bold">{stats.activeToday}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">New Users (Last 30 days)</p>
                    <p className="text-2xl font-bold">+{stats.newUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verification Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;