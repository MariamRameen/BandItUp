import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="w-full bg-white shadow-sm py-4 px-8 flex justify-between items-center border-b">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
          B
        </div>
        <h1 className="text-xl font-bold text-gray-900">BandItUp Admin Panel</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-gray-700 hover:text-purple-600 font-medium"
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="text-gray-700 hover:text-purple-600 font-medium"
        >
          Users
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}