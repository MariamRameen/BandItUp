
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        if (!token) {
          setError('Invalid verification link');
          setLoading(false);
          return;
        }

        const response = await apiService.verifyEmail(token);
        setMessage(response.message ? response.message : 'Email verified successfully!');
        
       
        if (response.token) {
          apiService.setToken(response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          setTimeout(() => {
            if (!response.user.examType || !response.user.targetScore) {
              navigate('/setup-profile');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message || 'Email verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyEmailToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl font-semibold text-[#333]">Email Verification</h1>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm text-center">
          {loading ? (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF] mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          ) : error ? (
            <div className="text-red-600">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Verification Failed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-3">
                <Link 
                  to="/login" 
                  className="inline-block text-[#7D3CFF] hover:text-[#6B2FE6] font-medium"
                >
                  Go to Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to Sign Up
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-green-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Email Verified!</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500 animate-pulse">
                Redirecting...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}