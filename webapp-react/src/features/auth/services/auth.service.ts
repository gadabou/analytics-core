import { apiService } from '@services/api';
import type { LoginCredentials, LoginResponse, User, ChangePasswordPayload } from '@/types';

class AuthService {
  private basePath = '/auth';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiService.post<LoginResponse>(`${this.basePath}/login`, credentials);
  }

  async logout(): Promise<void> {
    return apiService.post(`${this.basePath}/logout`);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return apiService.post<LoginResponse>(`${this.basePath}/refresh`, { refreshToken });
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>(`${this.basePath}/me`);
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    return apiService.post(`${this.basePath}/change-password`, payload);
  }

  async forgotPassword(email: string): Promise<void> {
    return apiService.post(`${this.basePath}/forgot-password`, { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiService.post(`${this.basePath}/reset-password`, { token, newPassword });
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await apiService.post(`${this.basePath}/validate-token`, { token });
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
