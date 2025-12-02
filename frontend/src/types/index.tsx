
export interface User {
  _id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  examType?: 'Academic' | 'General';
  targetScore?: number;
  language?: string;
  timezone?: string;
  avatarUrl?: string;
  theme: 'light' | 'dark';
  subscriptionStatus: 'free_trial' | 'active' | 'inactive' | 'cancelled' | 'admin' | 'premium';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}


export interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  premiumUsers: number;
  freeUsers: number;
  newUsers: number;
  academicUsers: number;
  generalUsers: number;
  verifiedUsers: number;
  activeToday: number;
}


export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  users?: User[];
  stats?: AdminStats;
  count?: number;
}