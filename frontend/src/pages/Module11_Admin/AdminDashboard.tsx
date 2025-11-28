import React, { useState } from 'react';
import Header from '../../components/Header';
import ManageUsers from './ManageUsers';
import ManageTests from './ManageTests';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Total Registered Users', value: '580', change: '+24%', trend: 'up' },
    { label: 'Avg. Band Score', value: '7.0', change: '+0.2', trend: 'up' },
    { label: 'Weekly Test Attempts', value: '1,247', change: '+12%', trend: 'up' },
    { label: 'New Signups', value: '95', change: '+8%', trend: 'up' },
  ];

  const recentUsers = [
    { id: 'U001', name: 'Sarah Johnson', email: 'sarah.j@email.com', subscription: 'Premium', status: 'Active', joinDate: '2024-10-01' },
    { id: 'U002', name: 'Michael Chen', email: 'mchen@email.com', subscription: 'Free', status: 'Active', joinDate: '2024-11-15' },
    { id: 'U003', name: 'Emily Rodríguez', email: 'emily.r@email.com', subscription: 'Premium', status: 'Active', joinDate: '2024-09-20' },
    { id: 'U004', name: 'James Wilson', email: 'jwilson@email.com', subscription: 'Free', status: 'Active', joinDate: '2024-12-01' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#333]">Admin Dashboard</h1>
            <p className="text-[#777] text-sm">Manage users, analytics, and platform performance</p>
          </div>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            Logout
          </button>
        </div>


       <div className="flex border-b border-[#F0E8FF] mb-6">
        {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'User Management' },
            { id: 'tests', label: 'Test Management' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'moderation', label: 'Moderation' }
        ].map(tab => (
            <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium ${
                activeTab === tab.id 
                ? 'text-[#7D3CFF] border-b-2 border-[#7D3CFF]' 
                : 'text-[#777] hover:text-[#333]'
            }`}
            >
            {tab.label}
            </button>
        ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                  <p className="text-sm text-[#777] mb-2">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-[#7D3CFF]">{stat.value}</p>
                    <span className={`text-sm ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold mb-4">Average Band Score Trend</h3>
                <div className="h-64 bg-[#F8F9FF] rounded-lg flex items-center justify-center text-[#AAA]">
                  Line Chart - Platform-wide performance over time
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold mb-4">User Growth Trend</h3>
                <div className="h-64 bg-[#F8F9FF] rounded-lg flex items-center justify-center text-[#AAA]">
                  Bar Chart - Total registered users over time
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold mb-4">Quick Stats Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-[#7D3CFF]">152</p>
                    <p className="text-sm text-[#777]">Active Users (7 days)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#7D3CFF]">245</p>
                    <p className="text-sm text-[#777]">Active Users (30 days)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#7D3CFF]">1,247</p>
                    <p className="text-sm text-[#777]">Tests This Week</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#7D3CFF]">42 min</p>
                    <p className="text-sm text-[#777]">Avg Session Time</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold mb-4">Subscription Distribution</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-lg font-bold mb-2">
                      72%
                    </div>
                    <p className="text-sm font-semibold">Free</p>
                    <p className="text-xs text-[#777]">420 users</p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-[#E2D9FF] rounded-full flex items-center justify-center text-[#7D3CFF] text-lg font-bold mb-2">
                      28%
                    </div>
                    <p className="text-sm font-semibold">Premium</p>
                    <p className="text-xs text-[#777]">160 users</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0E8FF]">
                      <th className="text-left py-3">User ID</th>
                      <th className="text-left py-3">Name</th>
                      <th className="text-left py-3">Email</th>
                      <th className="text-left py-3">Subscription</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-left py-3">Join Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(user => (
                      <tr key={user.id} className="border-b border-[#F0E8FF] hover:bg-[#F8F9FF]">
                        <td className="py-3">{user.id}</td>
                        <td className="py-3 font-medium">{user.name}</td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.subscription === 'Premium' 
                              ? 'bg-[#7D3CFF] text-white' 
                              : 'bg-[#F4F0FF] text-[#7D3CFF]'
                          }`}>
                            {user.subscription}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3">{user.joinDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h2 className="text-xl font-semibold mb-6">User Management</h2>
            <p className="text-[#777] text-center py-8">User management interface</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Analytics Dashboard</h2>
            <p className="text-[#777] text-center py-8">Analytics dashboard interface</p>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Moderation Center</h2>
            <p className="text-[#777] text-center py-8">Moderation interface</p>
          </div>
        )}
        {activeTab === 'tests' && <ManageTests />}
        {activeTab === 'users' && <ManageUsers />}  
      </div>
    </div>
  );
}