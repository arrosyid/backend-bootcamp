import AuthService from '../services/authService.js';
import { body, validationResult } from 'express-validator';
import { logger } from '../config/logger.js';

// Validation rules for login
const loginValidationRules = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

class AuthController {
    /**
     * Handles user login requests.
     * POST /api/v1/auth/login
     */
    async login(req, res, next) {
        // 1. Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Login validation failed:', { errors: errors.array(), body: req.body });
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // 2. Call AuthService to attempt login
            const result = await AuthService.login(email, password);

            // 3. Send response based on service result
            if (result.success) {
                // Exclude sensitive info if necessary before sending user data
                const { token, user } = result;
                res.status(result.status).json({
                    success: true,
                    message: result.message,
                    token: token,
                    user: user // Send user details provided by the service
                });
            } else {
                res.status(result.status).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            // Pass unexpected errors to the global error handler
            logger.error('Unexpected error in AuthController login:', { error: error.message, stack: error.stack });
            next(error); // Forward to error handling middleware
        }
    }

    // Add other auth-related controller methods if needed (e.g., register, logout, refresh token)
}

export { loginValidationRules }; // Export validation rules separately
export default new AuthController();
