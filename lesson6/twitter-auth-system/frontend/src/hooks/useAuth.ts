import { useMutation, useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import apiService from '../services/api';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation(
    async (credentials: { email: string; password: string }) => {
      const deviceFingerprint = generateDeviceFingerprint();
      return apiService.login({ ...credentials, deviceFingerprint });
    },
    {
      onSuccess: (response) => {
        const { user, tokens } = response.data.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      },
    }
  );

  const registerMutation = useMutation(
    (userData: { email: string; username: string; password: string }) =>
      apiService.register(userData),
    {
      onSuccess: (response) => {
        const { user, tokens } = response.data.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      },
    }
  );

  const logoutMutation = useMutation(
    async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await apiService.logout(refreshToken);
      }
    },
    {
      onSuccess: () => {
        clearAuth();
      },
    }
  );

  const profileQuery = useQuery(
    'profile',
    () => apiService.getProfile(),
    {
      enabled: isAuthenticated,
      retry: false,
    }
  );

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    profile: profileQuery.data?.data,
  };
};
