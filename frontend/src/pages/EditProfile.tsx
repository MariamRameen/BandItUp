import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';

interface ProfileData {
  examType: string;
  targetScore: number;
  language: string;
  timezone: string;
  displayName?: string;
  email?: string;
  phone?: string;
}

export default function EditProfile() {
  const [formData, setFormData] = useState<ProfileData>({
    examType: 'Academic',
    targetScore: 6.5,
    language: 'English',
    timezone: 'UTC+05:00'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if this is first-time setup or editing
  const isFirstTime = location.pathname === '/setup-profile';

  useEffect(() => {
    // Only fetch existing profile if editing (not first-time setup)
    if (!isFirstTime) {
      fetchCurrentProfile();
    }
  }, [isFirstTime]);

  const fetchCurrentProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      if (response.user) {
        setFormData({
          examType: response.user.examType || 'Academic',
          targetScore: response.user.targetScore || 6.5,
          language: response.user.language || 'English',
          timezone: response.user.timezone || 'UTC+05:00',
          displayName: response.user.displayName,
          email: response.user.email,
          phone: response.user.phone
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiService.updateProfile(formData);
      
      // Navigate based on context
      if (isFirstTime) {
        navigate('/dashboard'); // First-time → go to dashboard
      } else {
        navigate('/profile');   // Editing → go back to profile view
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isFirstTime) {
      navigate('/dashboard'); // First-time → can skip to dashboard
    } else {
      navigate('/profile');   // Editing → go back to profile view
    }
  };

  if (loading && !isFirstTime) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            B
          </div>
          <p className="text-[#777]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl font-semibold text-[#333]">
            {isFirstTime ? 'Complete Your Profile' : 'Edit Profile'}
          </h1>
          <p className="text-[#777] mt-2">
            {isFirstTime 
              ? 'Help us personalize your learning experience' 
              : 'Update your profile information'
            }
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show name/email fields only when editing existing profile */}
            {!isFirstTime && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
                  />
                </div>
              </>
            )}

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-3">
                IELTS Exam Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, examType: 'Academic'})}
                  className={`py-3 px-4 rounded-lg border-2 text-center font-medium ${
                    formData.examType === 'Academic'
                      ? 'border-[#7D3CFF] bg-[#F7F5FF] text-[#7D3CFF]'
                      : 'border-[#E2D9FF] text-[#777] hover:border-[#7D3CFF]'
                  }`}
                >
                  Academic
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, examType: 'General Training'})}
                  className={`py-3 px-4 rounded-lg border-2 text-center font-medium ${
                    formData.examType === 'General Training'
                      ? 'border-[#7D3CFF] bg-[#F7F5FF] text-[#7D3CFF]'
                      : 'border-[#E2D9FF] text-[#777] hover:border-[#7D3CFF]'
                  }`}
                >
                  General Training
                </button>
              </div>
            </div>

            {/* Target Score */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-3">
                Target Band Score: <span className="text-[#7D3CFF] font-semibold">{formData.targetScore}</span>
              </label>
              <input
                type="range"
                name="targetScore"
                min="4.0"
                max="9.0"
                step="0.5"
                value={formData.targetScore}
                onChange={handleInputChange}
                className="w-full h-2 bg-[#E2D9FF] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7D3CFF]"
              />
              <div className="flex justify-between text-xs text-[#777] mt-2">
                <span>4.0</span>
                <span>5.0</span>
                <span>6.0</span>
                <span>7.0</span>
                <span>8.0</span>
                <span>9.0</span>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Preferred Language
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-2">
                Timezone
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-[#E2D9FF] rounded-lg focus:outline-none focus:border-[#7D3CFF]"
              >
                <option value="UTC+05:00">UTC+05:00 (Pakistan Standard Time)</option>
                <option value="UTC+00:00">UTC+00:00 (GMT)</option>
                <option value="UTC-05:00">UTC-05:00 (EST)</option>
                <option value="UTC-08:00">UTC-08:00 (PST)</option>
                <option value="UTC+01:00">UTC+01:00 (CET)</option>
                <option value="UTC+08:00">UTC+08:00 (CST)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg font-semibold hover:bg-[#6B2FE6] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : (isFirstTime ? 'Complete Setup' : 'Save Changes')}
            </button>

            {/* Cancel/Skip Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="w-full bg-[#F4F0FF] text-[#7D3CFF] py-3 rounded-lg font-semibold hover:bg-[#E8DCFF] transition-colors"
            >
              {isFirstTime ? 'Skip for now' : 'Cancel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}