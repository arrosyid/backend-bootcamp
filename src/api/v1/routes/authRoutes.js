import express from 'express';
import AuthController, { loginValidationRules } from '../../../controllers/authController.js';
// Import any necessary middleware (e.g., rate limiting might apply here)
// import rateLimiter from '../../config/rateLimit.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     tags: [Auth]
 *     description: Logs in a user with email and password, returning a JWT token upon successful authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address.
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password.
 *                 example: Pa$$w0rd!
 *     responses:
 *       '200':
 *         description: Authentication successful, JWT token returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token.
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       '400':
 *         description: Bad Request - Invalid input data (e.g., missing fields, invalid email format).
 *       '401':
 *         description: Unauthorized - Invalid credentials provided.
 *       '500':
 *         description: Internal Server Error.
 */
router.post(
    '/login',
    // apply rateLimiter, // Optional: Apply rate limiting specifically to login
    loginValidationRules, // Apply validation rules
    AuthController.login   // Call the controller method
);

// Add other auth routes here if needed (e.g., /register, /refresh-token)

export default router;
