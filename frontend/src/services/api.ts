const clientId = (import.meta.env as any).VITE_GOOGLE_CLIENT_ID;
const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:4000/api';

interface User {
  examType?: string;
  targetScore?: number;
  isVerified?: boolean;
  baselineDone?: boolean;
  role?: string;
  [key: string]: any;
}

interface RegisterResponse {
  success?: boolean;
  message?: string;
  token?: string;
  user: User;
  msg?: string;
  [key: string]: any;
}

interface LoginResponse {
  token: string;
  user: User;
  message?: string;
  [key: string]: any;
}

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Something went wrong');
      }

      return data;
    } catch (error: any) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async register(userData: { email: string; password: string; displayName: string }): Promise<RegisterResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyEmail(token: string): Promise<LoginResponse> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail(email: string) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async googleLogin(tokenId: string) {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ tokenId }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getProfile() {
    return this.request('/profile/me');
  }

  async updateProfile(profileData: any) {
    return this.request('/profile/update', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/profile/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async uploadAvatar(formData: FormData) {
    return this.request('/profile/upload-avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
  }

  async completeBaseline() {
    return this.request('/profile/complete-baseline', {
      method: 'POST',
    });
  }
}

export default new ApiService();