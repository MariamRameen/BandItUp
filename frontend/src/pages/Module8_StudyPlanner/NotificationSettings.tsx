import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import { Bell, Mail, Clock, Trophy, TrendingUp, Flame, Lightbulb, Save, CheckCircle } from 'lucide-react';

const API_URL = "http://localhost:4000/api/notifications";
const auth = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  },
});

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  dailyReminders: boolean;
  dailyReminderTime: string;
  weeklyProgressReport: boolean;
  mockTestReminders: boolean;
  achievementNotifications: boolean;
  streakReminders: boolean;
  studyTips: boolean;
  timezone: string;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, auth());
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        ...auth(),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-xl mx-auto px-8 py-12 text-center">
          <p className="text-red-500">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />

      <div className="max-w-2xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/profile" className="text-[#7D3CFF] hover:underline text-sm">← Back to Profile</Link>
          <h1 className="text-2xl font-semibold text-[#333] mt-1">Notification Settings</h1>
          <p className="text-[#777] text-sm">Manage how you receive notifications</p>
        </div>

        {/* Global Settings */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <h3 className="font-semibold text-lg mb-4">Global Settings</h3>
          
          <div className="space-y-4">
            <ToggleSetting
              icon={<Bell size={20} className="text-[#7D3CFF]" />}
              label="Push Notifications"
              description="Receive notifications in the app"
              checked={settings.pushEnabled}
              onChange={(v) => updateSetting('pushEnabled', v)}
            />
            
            <ToggleSetting
              icon={<Mail size={20} className="text-[#7D3CFF]" />}
              label="Email Notifications"
              description="Receive notifications via email"
              checked={settings.emailEnabled}
              onChange={(v) => updateSetting('emailEnabled', v)}
            />
          </div>
        </div>

        {/* Study Reminders */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <h3 className="font-semibold text-lg mb-4">Study Reminders</h3>
          
          <div className="space-y-4">
            <ToggleSetting
              icon={<Clock size={20} className="text-blue-500" />}
              label="Daily Study Reminders"
              description="Get reminded to study every day"
              checked={settings.dailyReminders}
              onChange={(v) => updateSetting('dailyReminders', v)}
            />
            
            {settings.dailyReminders && (
              <div className="ml-10 p-4 bg-[#F8F6FF] rounded-xl">
                <label className="text-sm text-[#666] block mb-2">Reminder Time</label>
                <input
                  type="time"
                  value={settings.dailyReminderTime}
                  onChange={(e) => updateSetting('dailyReminderTime', e.target.value)}
                  className="px-4 py-2 border border-[#E0E0E0] rounded-lg focus:border-[#7D3CFF] focus:outline-none"
                />
              </div>
            )}
            
            <ToggleSetting
              icon={<Flame size={20} className="text-orange-500" />}
              label="Streak Reminders"
              description="Get warned before your streak breaks"
              checked={settings.streakReminders}
              onChange={(v) => updateSetting('streakReminders', v)}
            />
          </div>
        </div>

        {/* Progress & Achievements */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <h3 className="font-semibold text-lg mb-4">Progress & Achievements</h3>
          
          <div className="space-y-4">
            <ToggleSetting
              icon={<TrendingUp size={20} className="text-green-500" />}
              label="Weekly Progress Reports"
              description="Get a summary of your weekly progress"
              checked={settings.weeklyProgressReport}
              onChange={(v) => updateSetting('weeklyProgressReport', v)}
            />
            
            <ToggleSetting
              icon={<Trophy size={20} className="text-yellow-500" />}
              label="Achievement Notifications"
              description="Get notified when you unlock achievements"
              checked={settings.achievementNotifications}
              onChange={(v) => updateSetting('achievementNotifications', v)}
            />
            
            <ToggleSetting
              icon={<Bell size={20} className="text-purple-500" />}
              label="Mock Test Reminders"
              description="Get reminded to take mock tests regularly"
              checked={settings.mockTestReminders}
              onChange={(v) => updateSetting('mockTestReminders', v)}
            />
          </div>
        </div>

        {/* Tips & Updates */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
          <h3 className="font-semibold text-lg mb-4">Tips & Updates</h3>
          
          <div className="space-y-4">
            <ToggleSetting
              icon={<Lightbulb size={20} className="text-amber-500" />}
              label="Study Tips"
              description="Receive helpful IELTS preparation tips"
              checked={settings.studyTips}
              onChange={(v) => updateSetting('studyTips', v)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={18} />
              <span>Settings saved!</span>
            </div>
          )}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-[#7D3CFF] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6B2FE6] disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Save size={18} />
            )}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSetting({ icon, label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-[#F4F0FF] rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-[#777]">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7D3CFF]"></div>
      </label>
    </div>
  );
}
