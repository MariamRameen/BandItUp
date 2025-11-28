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
  lastLogin?: string;
  createdAt?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiService.getProfile();
      setProfile(response);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  console.log('📸 Avatar upload started:', file.name);
  console.log('📁 File details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });
  

  if (!file.type.startsWith('image/')) {
    setError('Please select an image file (JPEG, PNG, etc.)');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError('Image must be less than 5MB');
    return;
  }

  try {
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('avatar', file);
    
    console.log('🔼 Uploading avatar...');
    const response = await apiService.uploadAvatar(formData);
    console.log('✅ Avatar upload response:', response);
    console.log('🖼️ New avatar URL:', response.avatarUrl);
    
   
    if (profile) {
      setProfile({ 
        ...profile, 
        avatarUrl: response.avatarUrl 
      });
    }
    
    
    setTimeout(() => {
      if (profile) {
        setProfile(prev => prev ? {...prev, avatarUrl: response.avatarUrl + '?t=' + Date.now()} : null);
      }
    }, 100);
    
  } catch (err: any) {
    console.error('❌ Avatar upload error:', err);
    setError(err.message || 'Failed to upload avatar');
  } finally {
    setUploading(false);
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

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <p className="text-sm text-gray-600 mb-4">Make sure you're logged in and the backend is running</p>
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

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {profile && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl border-2 border-[#E2D9FF] overflow-hidden">
                      {profile.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-[#7D3CFF] flex items-center justify-center text-white text-2xl font-bold ${profile.avatarUrl ? 'hidden' : 'flex'}`}
                      >
                        {profile.displayName?.charAt(0) || 'U'}
                      </div>
                    </div>
                    
                    <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-[#7D3CFF] text-white p-1.5 rounded-full text-xs cursor-pointer hover:bg-[#6B2FE6]">
                      📷
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                                      
                  
                  <div>
                    <h2 className="text-xl font-semibold text-[#333]">{profile.displayName}</h2>
                    <p className="text-[#777]">{profile.email}</p>
                    {uploading && (
                      <p className="text-[#7D3CFF] text-sm mt-1">Uploading avatar...</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-[#777] mb-2">Exam Type</h3>
                    <p className="text-[#333] font-medium">
                      {profile.examType === 'General' ? 'General Training' : profile.examType}
                    </p>
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
                    <p className="text-[#333] font-medium capitalize">
                      {profile.subscriptionStatus?.replace('_', ' ') || 'Free Trial'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

           
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold text-[#333] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                
                  <button
                    onClick={handleChangePassword}
                    className="w-full text-left p-3 rounded-lg border border-[#E2D9FF] hover:bg-[#F7F5FF] text-[#333]"
                  >
                    🔒 Change Password
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