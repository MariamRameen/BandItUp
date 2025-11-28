import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

declare global {
  interface Window {
    google: any;
  }
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.querySelector('#google-oauth-script')) return;

      const script = document.createElement('script');
      script.id = 'google-oauth-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google) {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
          console.log('Google Client ID:', clientId); 
          
          if (!clientId) {
            console.error('Google Client ID not found in environment variables');
            return;
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
          });

          if (document.getElementById('googleSignInButton')) {
            window.google.accounts.id.renderButton(
              document.getElementById('googleSignInButton'),
              { 
                theme: 'outline', 
                size: 'large',
                width: '100%',
                text: 'continue_with'
              }
            );
          }
        }
      }; 
      document.head.appendChild(script); 
    };

    loadGoogleScript();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { email, password } = formData;
      
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      const response = await apiService.login({ email, password });
      apiService.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      if (!response.user.examType || !response.user.targetScore) {
        navigate('/setup-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      const result = await apiService.googleLogin(response.credential);
      apiService.setToken(result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      if (!result.user.examType || !result.user.targetScore) {
        navigate('/setup-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
       
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl font-semibold text-[#333]">BandItUp</h1>
          <p className="text-[#777] mt-2">Your personalized path to IELTS success</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#333]">Welcome</h2>
            <p className="text-[#777] text-sm">Sign in to continue your learning journey</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                required
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-[#7D3CFF] text-sm hover:text-[#6B2FE6]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg font-semibold hover:bg-[#6B2FE6] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-[#F0E8FF]"></div>
            <span className="px-4 text-sm text-[#777]">Or continue with</span>
            <div className="flex-1 border-t border-[#F0E8FF]"></div>
          </div>

          {/* Google Sign-In Button */}
          <div className="space-y-3">
            <div id="googleSignInButton"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-[#777] text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#7D3CFF] font-medium hover:text-[#6B2FE6]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}