import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {

  const resetResponse = await apiService.forgotPassword(email);
  

  await apiService.resetPassword(resetResponse.resetToken, password);
  
  setSuccess(true);
  setTimeout(() => {
    navigate('/login');
  }, 3000);
  
} 
    catch (err: any) {
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-[#333]">
              Set Password for Google Account
            </h2>
            <p className="text-[#777] mt-2">
              Set a password for: <span className="font-medium">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Password set successfully! You can now login with email and password.
              Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg font-semibold hover:bg-[#6B2FE6] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Setting Password...' : 'Set Password'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/login')}
              className="text-[#7D3CFF] font-medium hover:text-[#6B2FE6]"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}