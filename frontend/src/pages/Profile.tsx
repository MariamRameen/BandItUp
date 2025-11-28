import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';


interface UserProfile {
  id: string;
  email: string;
  phone: string;
  displayName: string;
  examType: string;
  targetScore: number;
  language: string;
  timezone: string;
  avatarUrl: string;
  theme: string;
  subscriptionStatus: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiService.getProfile();
      setProfile(response.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
  navigate('/profile/edit'); 
};

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            B
          </div>
          <p className="text-[#777]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button 
            onClick={fetchProfile}
            className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#E2D9FF] hover:bg-[#F7F5FF]"
            >
              ←
            </Link>
            <h1 className="text-2xl font-semibold text-[#333]">My Profile</h1>
          </div>
          <button
            onClick={handleEditProfile}
            className="bg-[#7D3CFF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#6B2FE6]"
          >
            Edit Profile
          </button>
        </div>

        {profile && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 bg-[#7D3CFF] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                    {profile.displayName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#333]">{profile.displayName}</h2>
                    <p className="text-[#777]">{profile.email}</p>
                    <p className="text-[#777] text-sm">{profile.phone || 'No phone number'}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-[#777] mb-2">Exam Type</h3>
                    <p className="text-[#333] font-medium">{profile.examType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#777] mb-2">Target Score</h3>
                    <p className="text-[#333] font-medium">{profile.targetScore} Band</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#777] mb-2">Language</h3>
                    <p className="text-[#333] font-medium">{profile.language}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#777] mb-2">Timezone</h3>
                    <p className="text-[#333] font-medium">{profile.timezone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#777] mb-2">Theme</h3>
                    <p className="text-[#333] font-medium capitalize">{profile.theme}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#777] mb-2">Subscription</h3>
                    <p className="text-[#333] font-medium capitalize">{profile.subscriptionStatus.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold text-[#333] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEditProfile}
                    className="w-full text-left p-3 rounded-lg border border-[#E2D9FF] hover:bg-[#F7F5FF] text-[#333]"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="w-full text-left p-3 rounded-lg border border-[#E2D9FF] hover:bg-[#F7F5FF] text-[#333]"
                  >
                    🔒 Change Password
                  </button>
                  <button className="w-full text-left p-3 rounded-lg border border-[#E2D9FF] hover:bg-[#F7F5FF] text-[#333]">
                    🎨 Appearance
                  </button>
                  <button className="w-full text-left p-3 rounded-lg border border-[#E2D9FF] hover:bg-[#F7F5FF] text-[#333]">
                    💳 Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}