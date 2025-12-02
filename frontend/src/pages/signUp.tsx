import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google) return;
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('Google Client ID not found');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      setTimeout(() => {
        const buttonElement = document.getElementById('googleSignUpButton');
        if (buttonElement) {
          buttonElement.innerHTML = ''; 
          window.google.accounts.id.renderButton(buttonElement, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signup_with'
          });
        }
      }, 300); 
    };

    if (window.google) {
      initializeGoogle();
    } else {
      if (!document.querySelector('script[src*="accounts.google.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.head.appendChild(script);
      }
    }
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
  setSuccess(false);

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    setError('Please enter a valid email address');
    setLoading(false);
    return;
  }

  try {
    const { confirmPassword, ...submitData } = formData;
    const response = await apiService.register(submitData);
    
    
    if (response.token) {
    
      apiService.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/setup-profile');
    } else if (response.success || response.message) {
      
      setSuccess(true);
      setFormData({
        email: '',
        displayName: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      
      throw new Error(response.msg || 'Registration failed');
    }
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
      apiService.setToken(result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      if (!result.user.examType || !result.user.targetScore) {
        navigate('/setup-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Google signup failed. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    try {
      await apiService.resendVerificationEmail(formData.email);
      setSuccess(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl font-semibold text-[#333]">Join BandItUp</h1>
          <p className="text-[#777] mt-2">Start your IELTS journey today</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm">
          {/* Success Message - Only show when verification is required */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Registration Successful!</p>
              <p className="text-sm mt-1">
                Please check your email ({formData.email}) for a verification link to activate your account.
              </p>
              <div className="mt-3 pt-3 border-t border-green-300">
                <p className="text-sm text-green-800">
                  <strong>Didn't receive the email?</strong>
                </p>
                <button
                  onClick={handleResendVerification}
                  className="text-sm text-[#7D3CFF] hover:text-[#6B2FE6] font-medium mt-1"
                >
                  Click here to resend verification email
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Show form only if not in success state */}
          {!success ? (
            <>
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

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-[#F0E8FF]"></div>
                <span className="px-4 text-sm text-[#777]">Or sign up with</span>
                <div className="flex-1 border-t border-[#F0E8FF]"></div>
              </div>

              <div id="googleSignUpButton"></div>
            </>
          ) : (
            // Show success message and options
            <div className="text-center">
              <div className="mb-4 text-green-600">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Check Your Email!</h3>
              <p className="text-gray-600 mb-4">
                We've sent a verification link to <strong>{formData.email}</strong>
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="text-[#7D3CFF] hover:text-[#6B2FE6] font-medium"
                >
                  Sign up with a different email
                </button>
                <p className="text-sm text-gray-500">
                  Already verified?{' '}
                  <Link to="/login" className="text-[#7D3CFF] hover:text-[#6B2FE6]">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Show "Already have account" link if not in success state */}
          {!success && (
            <div className="text-center mt-6">
              <p className="text-[#777] text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-[#7D3CFF] font-medium hover:text-[#6B2FE6]">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}