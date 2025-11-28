import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';



declare global {
  interface Window {
    google: any;
  }
}

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Google OAuth Effect
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

        // Render button for signup page  
        if (document.getElementById('googleSignUpButton')) {
          window.google.accounts.id.renderButton(
            document.getElementById('googleSignUpButton'),
            { 
              theme: 'outline', 
              size: 'large',
              width: '100%',
              text: 'signup_with'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.displayName) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await apiService.register(submitData);
      apiService.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to profile setup
      navigate('/setup-profile');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      const result = await apiService.googleLogin(response.credential);
      console.log('Google login API result:', result);
      apiService.setToken(result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      if (!result.user.examType || !result.user.targetScore) {
        navigate('/setup-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Google signup error:', err); 
      setError('Google signup failed. Please try again.');
    }
  };

  const handleGoogleSignup = async () => {
    console.log('Google signup button clicked'); 
    try {
      if (window.google) {
        console.log('Google API is available');
        window.google.accounts.id.prompt();
      } else {
        console.log('Google API not available');
        setError('Google Sign-In not available. Please try again.');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Google signup failed. Please try another method.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl font-semibold text-[#333]">Join BandItUp</h1>
          <p className="text-[#777] mt-2">Start your IELTS journey today</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                required
              />
            </div>

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
                placeholder="At least 6 characters"
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
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-[#F0E8FF]"></div>
            <span className="px-4 text-sm text-[#777]">Or sign up with</span>
            <div className="flex-1 border-t border-[#F0E8FF]"></div>
          </div>

          {/* Google Sign-Up Button */}
          <div className="space-y-3">
            <div id="googleSignUpButton"></div>
            
            {/* Fallback button */}
            <button 
              onClick={handleGoogleSignup}
              className="w-full bg-white border border-[#E2D9FF] text-[#333] py-3 rounded-lg font-medium hover:bg-[#F8F9FF] flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-[#777] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#7D3CFF] font-medium hover:text-[#6B2FE6]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}