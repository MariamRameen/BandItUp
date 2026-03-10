import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="w-full bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/20 py-4 px-8 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#7D3CFF] flex items-center justify-center text-white font-bold text-lg">
          B
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">BandItUp Admin Panel</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-gray-700 dark:text-gray-300 hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] font-medium transition-colors"
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="text-gray-700 dark:text-gray-300 hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] font-medium transition-colors"
        >
          Users
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}