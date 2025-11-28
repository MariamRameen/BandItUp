import React, { useState } from 'react';
import Header from '../../components/Header';

export default function ManageUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState('all');

  const users = [
    {
      id: 'U001',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      subscription: 'Premium',
      role: 'User',
      status: 'Active',
      joinDate: '2024-10-01',
      lastActive: '2024-12-15',
      testsTaken: 12,
      avgScore: 7.2
    },
    {
      id: 'U002',
      name: 'Michael Chen',
      email: 'mchen@email.com',
      subscription: 'Free',
      role: 'User',
      status: 'Active',
      joinDate: '2024-11-15',
      lastActive: '2024-12-14',
      testsTaken: 8,
      avgScore: 6.8
    },
    {
      id: 'U003',
      name: 'Emily Rodríguez',
      email: 'emily.r@email.com',
      subscription: 'Premium',
      role: 'User',
      status: 'Active',
      joinDate: '2024-09-20',
      lastActive: '2024-12-15',
      testsTaken: 15,
      avgScore: 7.5
    },
    {
      id: 'U004',
      name: 'James Wilson',
      email: 'jwilson@email.com',
      subscription: 'Free',
      role: 'User',
      status: 'Inactive',
      joinDate: '2024-12-01',
      lastActive: '2024-12-05',
      testsTaken: 2,
      avgScore: 6.0
    },
    {
      id: 'U005',
      name: 'Lisa Anderson',
      email: 'lisa.a@email.com',
      subscription: 'Premium',
      role: 'Admin',
      status: 'Active',
      joinDate: '2024-06-10',
      lastActive: '2024-12-15',
      testsTaken: 25,
      avgScore: 8.1
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    const matchesSubscription = selectedSubscription === 'all' || user.subscription === selectedSubscription;
    
    return matchesSearch && matchesRole && matchesStatus && matchesSubscription;
  });

  const handleEditUser = (userId: any) => {
    console.log('Edit user:', userId);
   
  };

  const handleChangeRole = (userId: any, newRole: any) => {
  console.log('Change role for user:', userId, 'to:', newRole);
};


  const handleChangeStatus = (userId: any, newStatus: any) => {
    console.log('Change status for user:', userId, 'to:', newStatus);
    
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">User Management</h1>
            <p className="text-[#777] text-sm">Manage user accounts, roles, and subscriptions</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
              Export Users
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Add New User
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
            >
              <option value="all">All Roles</option>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
              <option value="Moderator">Moderator</option>
            </select>
            <select
              value={selectedSubscription}
              onChange={(e) => setSelectedSubscription(e.target.value)}
              className="px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
            >
              <option value="all">All Subscriptions</option>
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          
          <div className="flex justify-between items-center text-sm text-[#777]">
            <span>Showing {filteredUsers.length} of {users.length} users</span>
            <span>Sort by: Join Date</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-[#F0E8FF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F9FF] border-b border-[#F0E8FF]">
                  <th className="text-left py-4 px-6 font-semibold text-sm">User ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Email</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Subscription</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Role</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Join Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Tests Taken</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Avg Score</th>
                  <th className="text-left py-4 px-6 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#F0E8FF] hover:bg-[#F8F9FF]">
                    <td className="py-4 px-6 text-sm font-medium">{user.id}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-[#333]">{user.name}</div>
                        <div className="text-xs text-[#777]">Last active: {user.lastActive}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscription === 'Premium' 
                          ? 'bg-[#7D3CFF] text-white' 
                          : 'bg-[#F4F0FF] text-[#7D3CFF]'
                      }`}>
                        {user.subscription}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="text-sm border border-[#E2D9FF] rounded px-2 py-1 focus:outline-none focus:border-[#7D3CFF]"
                      >
                        <option value="User">User</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={user.status}
                        onChange={(e) => handleChangeStatus(user.id, e.target.value)}
                        className={`text-sm border rounded px-2 py-1 focus:outline-none ${
                          user.status === 'Active' 
                            ? 'border-green-300 bg-green-50 text-green-800' 
                            : user.status === 'Inactive'
                            ? 'border-yellow-300 bg-yellow-50 text-yellow-800'
                            : 'border-red-300 bg-red-50 text-red-800'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-sm">{user.joinDate}</td>
                    <td className="py-4 px-6 text-sm text-center">{user.testsTaken}</td>
                    <td className="py-4 px-6 text-sm text-center font-semibold text-[#7D3CFF]">
                      {user.avgScore}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="text-[#7D3CFF] hover:text-[#6B2FE6] text-sm"
                        >
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-[#F8F9FF] px-6 py-4 border-t border-[#F0E8FF]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#777]">Page 1 of 3</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-[#E2D9FF] rounded text-sm hover:bg-white">
                  Previous
                </button>
                <button className="px-3 py-1 bg-[#7D3CFF] text-white rounded text-sm hover:bg-[#6B2FE6]">
                  1
                </button>
                <button className="px-3 py-1 border border-[#E2D9FF] rounded text-sm hover:bg-white">
                  2
                </button>
                <button className="px-3 py-1 border border-[#E2D9FF] rounded text-sm hover:bg-white">
                  3
                </button>
                <button className="px-3 py-1 border border-[#E2D9FF] rounded text-sm hover:bg-white">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">{users.length}</p>
            <p className="text-sm text-[#777]">Total Users</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">
              {users.filter(u => u.subscription === 'Premium').length}
            </p>
            <p className="text-sm text-[#777]">Premium Users</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">
              {users.filter(u => u.status === 'Active').length}
            </p>
            <p className="text-sm text-[#777]">Active Users</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <p className="text-2xl font-bold text-[#7D3CFF]">
              {users.reduce((acc, user) => acc + user.testsTaken, 0)}
            </p>
            <p className="text-sm text-[#777]">Total Tests Taken</p>
          </div>
        </div>
      </div>
    </div>
  );
}