import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegistration, validateLogin, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
// import { rateLimitMiddleware } from '../middleware/rateLimiting.js';

const router = Router();

// Registration endpoint
router.post('/register', 
  // rateLimitMiddleware,
  validateRegistration,
  handleValidationErrors,
  authController.register
);

// Login endpoint
router.post('/login', 
  // rateLimitMiddleware,
  validateLogin,
  handleValidationErrors,
  authController.login
);

// Token refresh endpoint
router.post('/refresh', 
  // rateLimitMiddleware,
  authController.refreshToken
);

// Logout endpoint
router.post('/logout', 
  // rateLimitMiddleware,
  authController.logout
);

router.get('/profile', authenticateToken, authController.getProfile);

export default router;
