
import React from 'react';
import { Link } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="w-full bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800/20 py-4 px-8 flex justify-between items-center border-b border-transparent dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#7D3CFF] flex items-center justify-center text-white font-bold text-lg">
          B
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link to="/dashboard" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Dashboard</Link>
          <Link to="/mock-tests" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Mock Tests</Link>
          <Link to="/listening" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Listening</Link>
          <Link to="/reading" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Reading</Link>
          <Link to="/writing" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Writing</Link>
          <Link to="/speaking" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Speaking</Link>
          <Link to="/vocabulary" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Vocabulary</Link>
          <Link to="/study-planner" className="hover:text-[#7D3CFF] dark:hover:text-[#9D6CFF] transition-colors">Study Planner</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationCenter />
        <Link to="/mock-tests" className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg shadow-md text-sm hover:bg-[#6B2FE6] transition-colors">
          Take Mock Test
        </Link>
        <Link to="/profile">
          <div className="w-10 h-10 rounded-full bg-[#7D3CFF] text-white flex items-center justify-center font-semibold">
            {JSON.parse(localStorage.getItem('user') || '{"displayName":"User"}').displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
}