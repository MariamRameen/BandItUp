import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedEmail && savedRememberMe) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }

    const initializeGoogle = () => {
      if (!window.google) return;
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      setTimeout(() => {
        const buttonElement = document.getElementById('googleSignInButton');
        if (buttonElement) {
          buttonElement.innerHTML = '';
          window.google.accounts.id.renderButton(buttonElement, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with'
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

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      const response = await apiService.login({ email, password });
      
      apiService.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('role', response.user.role);

      const userRole = response.user?.role?.toString().trim().toLowerCase();
      
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (!response.user.examType || !response.user.targetScore) {
        navigate('/setup-profile');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('Account created with Google') || 
          errorMessage.includes('correct login method')) {
        
        setError(
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium">
              This account was created with Google
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                onClick={() => {
                  const googleBtn = document.querySelector('#googleSignInButton div') as HTMLElement;
                  if (googleBtn) {
                    googleBtn.click();
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-md transition-all"
              >
                Login with Google
              </button>
              <button 
                type="button"
                onClick={() => navigate('/set-password', { 
                state: { email: formData.email } 
              })}
                              className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-all"
              >
                Set a Password
              </button>
            </div>
          </div>
        );
      } else {
        setError(errorMessage);
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
      localStorage.setItem('role', result.user.role);
      
      const userRole = result.user?.role?.toString().trim().toLowerCase();
      
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (!result.user.examType || !result.user.targetScore) {
        navigate('/setup-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <div className="mb-4">
              {typeof error === 'string' ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              ) : (
                error
              )}
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF] pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#777] hover:text-[#333] focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#7D3CFF] focus:ring-[#7D3CFF] border-[#E2D9FF] rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-[#555]">
                  Remember me
                </label>
              </div>
              
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

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-[#F0E8FF]"></div>
            <span className="px-4 text-sm text-[#777]">Or continue with</span>
            <div className="flex-1 border-t border-[#F0E8FF]"></div>
          </div>

          <div id="googleSignInButton"></div>

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