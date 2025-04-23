import express from 'express';
import AuthController, { loginValidationRules } from '../../../controllers/authController.js';
// Import any necessary middleware (e.g., rate limiting might apply here)
// import rateLimiter from '../../config/rateLimit.js';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post(
    '/login',
    // apply rateLimiter, // Optional: Apply rate limiting specifically to login
    loginValidationRules, // Apply validation rules
    AuthController.login   // Call the controller method
);

// Add other auth routes here if needed (e.g., /register, /refresh-token)

export default router;
