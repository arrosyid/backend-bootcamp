import prisma from '../../prisma/prisma.js';
import jwt from 'jsonwebtoken';
import { jwtSecret, jwtExpiresIn } from '../config/auth.js';
import { logger } from '../config/logger.js';
// Consider adding a password hashing library like bcrypt
// import bcrypt from 'bcrypt';

class AuthService {
    /**
     * Authenticates a user based on email and password.
     * @param {string} email - User's email.
     * @param {string} password - User's password.
     * @returns {Promise<object>} - Contains success status, message, and token if successful.
     */
    async login(email, password) {
        try {
            logger.info(`Login attempt for email: ${email}`);

            const user = await prisma.user.findUnique({
                where: { email: email },
            });

            if (!user) {
                logger.warn(`Login failed: User not found with email ${email}`);
                return { success: false, status: 401, message: 'Invalid email or password' };
            }

            // --- IMPORTANT ---
            // Password comparison should use a secure hashing algorithm (e.g., bcrypt).
            // Storing plain text passwords is a major security risk.
            // Example with bcrypt:
            // const isPasswordValid = await bcrypt.compare(password, user.password);
            // if (!isPasswordValid) { ... }

            // Current implementation (INSECURE - assumes plain text password):
            if (password !== user.password) {
                logger.warn(`Login failed: Incorrect password for email ${email}`);
                return { success: false, status: 401, message: 'Invalid email or password' };
            }

            // --- Check if user is active ---
            // You might want to add a check here if users need activation
            // if (!user.is_active) {
            //     logger.warn(`Login failed: User account not active for email ${email}`);
            //     return { success: false, status: 403, message: 'Account not activated' };
            // }


            // Generate JWT token
            const payload = {
                id: user.id,
                role: user.role,
                // Add any other relevant user info to the token payload
            };
            const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

            logger.info(`Login successful for user ${user.id} (Email: ${email})`);
            return {
                success: true,
                status: 200,
                message: 'Login successful',
                token: token,
                user: { // Optionally return some user details (exclude password)
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            };

        } catch (error) {
            logger.error('Error during login process:', { error: error.message, email: email });
            return { success: false, status: 500, message: 'Internal server error during login' };
        }
    }
}

export default new AuthService();
