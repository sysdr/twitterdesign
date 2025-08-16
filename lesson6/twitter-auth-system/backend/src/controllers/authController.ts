import { Request, Response } from 'express';
import authService from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import analyticsService from '../services/analyticsService.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    
    // Record successful registration
    await analyticsService.recordSecurityEvent(
      result.user.id,
      'register',
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      true,
      { username: result.user.username, email: result.user.email }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username
        },
        tokens: result.tokens
      }
    });
  } catch (error: any) {
          // Record failed registration
      await analyticsService.recordSecurityEvent(
        null,
        'register',
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        false,
        { error: error instanceof Error ? error.message : String(error) }
      );

    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
      return;
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    
    if (!result) {
      // Record failed login attempt
      await analyticsService.recordSecurityEvent(
        null,
        'login',
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        false,
        { email: req.body.email, reason: 'Invalid credentials' }
      );

      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Record successful login
    await analyticsService.recordSecurityEvent(
      result.user.id,
      'login',
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      true,
      { username: result.user.username, email: result.user.email }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username
        },
        tokens: result.tokens
      }
    });
  } catch (error) {
          // Record failed login attempt
      await analyticsService.recordSecurityEvent(
        null,
        'login',
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown',
        false,
        { error: error instanceof Error ? error.message : String(error) }
      );

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
      return;
    }

    const result = await authService.refreshTokens(refreshToken);
    
    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: result.tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
};
