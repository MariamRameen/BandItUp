
import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm py-4 px-8 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#7D3CFF] flex items-center justify-center text-white font-bold text-lg">
          B
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-[#666]">
          <Link to="/dashboard" className="hover:text-[#7D3CFF]">Dashboard</Link>
          <Link to="/mock-tests" className="hover:text-[#7D3CFF]">Mock Tests</Link>
          <Link to="/listening" className="hover:text-[#7D3CFF]">Listening</Link>
          <Link to="/reading" className="hover:text-[#7D3CFF]">Reading</Link>
          <Link to="/writing" className="hover:text-[#7D3CFF]">Writing</Link>
          <Link to="/speaking" className="hover:text-[#7D3CFF]">Speaking</Link>
          <Link to="/vocabulary" className="hover:text-[#7D3CFF]">Vocabulary</Link>
          <Link to="/study-planner" className="hover:text-[#7D3CFF]">Study Planner</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg shadow-md text-sm hover:bg-[#6B2FE6]">
          Take Mock Test
        </button>
        <Link to="/profile">
                    <div className="w-10 h-10 rounded-full bg-[#7D3CFF] text-white flex items-center justify-center font-semibold">
                    {JSON.parse(localStorage.getItem('user') || '{"displayName":"User"}').displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  </Link>
      </div>
    </header>
  );
}