export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  device_fingerprint?: string;
  is_trusted_device: boolean;
  expires_at: Date;
  created_at: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerprint?: string;
}
