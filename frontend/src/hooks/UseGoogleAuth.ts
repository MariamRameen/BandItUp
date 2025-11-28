import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiService from '../services/api';

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const initializeGoogleAuth = () => {
    if (!(window as any).google) {
      console.error('Google API not loaded');
      return;
    }

    (window as any).google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
    });
  };

  const handleGoogleResponse = async (response: { credential: string }) => {
    setLoading(true);
    setError('');

    try {
      const userData = jwtDecode(response.credential);
      console.log('Google user data:', userData);

      const result = await apiService.googleLogin(response.credential);
      apiService.setToken(result.token);

      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Google login failed');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const promptGoogleLogin = () => {
    if (!(window as any).google) {
      setError('Google Sign-In not available');
      return;
    }

    (window as any).google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError('Please allow pop-ups for Google Sign-In');
      }
    });
  };

  return {
    loading,
    error,
    initializeGoogleAuth,
    handleGoogleResponse,
    promptGoogleLogin,
  };
};
