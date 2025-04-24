import express from 'express';
import UserController, {
    userIdParamValidation,
    createUserValidation,
    updateUserValidation
} from '../../../controllers/userController.js'; // Corrected path
import authMiddleware from '../../../middlewares/authMiddleware.js'; // Corrected path
import roleMiddleware from '../../../middlewares/roleMiddleware.js'; // Corrected path
import upload from '../../../config/multer.js'; // Corrected path
import { handleMulterError } from '../../../middlewares/errorMiddleware.js'; // Corrected path

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *           example: clx123abc456def789
 *         name:
 *           type: string
 *           description: User's name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@example.com
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role
 *           example: user
 *         isActive:
 *           type: boolean
 *           description: User's activation status
 *           example: true
 *         avatar:
 *           type: string
 *           format: url
 *           description: URL to the user's avatar image
 *           example: http://localhost:3000/uploads/avatars/clx123abc456def789.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of user creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last user update
 *     UserInputRequired:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe
 *         email:
 *           type: string
 *           format: email
 *           example: jane.doe@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: StrongPwd123!
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *     UserInputOptional:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Jane Doe Updated
 *         email:
 *           type: string
 *           format: email
 *           example: jane.doe.updated@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: New password (optional)
 *           example: NewStrongPwd456?
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: admin
 *         isActive:
 *           type: boolean
 *           example: false
 *
 * tags:
 *   name: Users
 *   description: User management operations
 */

// --- Protected Routes ---
// Apply auth middleware to all routes in this file
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve a list of users or the current user
 *     tags: [Users]
 *     description: Admins can retrieve all users. Regular users retrieve their own profile. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of users (for admin) or a single user object (for user).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User does not have permission (should not happen if logic is in controller).
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/', UserController.getUsers);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     description: Creates a new user account. Requires admin privileges and authentication. Allows avatar upload.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/UserInputRequired'
 *               - type: object
 *                 properties:
 *                   avatar:
 *                     type: string
 *                     format: binary
 *                     description: Optional avatar image file (jpg, png, gif). Max 2MB.
 *     responses:
 *       '201':
 *         description: User created successfully. Returns the created user object (excluding password).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request - Invalid input data, validation error, or file upload error.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User is not an admin.
 *       '500':
 *         description: Internal Server Error.
 */
router.post(
    '/',
    roleMiddleware(['admin']), // Only admins can create users
    upload.single('avatar'),   // Handle single file upload named 'avatar'
    handleMulterError,         // Handle Multer errors specifically after upload attempt
    createUserValidation,      // Validate request body
    UserController.createUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [Users]
 *     description: Updates an existing user's details. Requires authentication. Admins can update any user, regular users can only update their own profile. Allows avatar update.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update.
 *         example: clx123abc456def789
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/UserInputOptional' # Use optional schema for updates
 *               - type: object
 *                 properties:
 *                   avatar:
 *                     type: string
 *                     format: binary
 *                     description: Optional new avatar image file (jpg, png, gif). Max 2MB.
 *     responses:
 *       '200':
 *         description: User updated successfully. Returns the updated user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request - Invalid input data, validation error, or file upload error.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User does not have permission to update this profile.
 *       '404':
 *         description: Not Found - User with the specified ID not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.put(
    '/:id',
    // roleMiddleware(['admin', 'user']), // Auth check done in controller for owner logic
    upload.single('avatar'),
    handleMulterError,
    updateUserValidation, // Validates both param and body
    UserController.updateUser
);

/**
 * @swagger
 * /api/v1/users/activate/{id}:
 *   patch:
 *     summary: Activate or deactivate a user account
 *     tags: [Users]
 *     description: Toggles the activation status of a user account. Requires admin privileges and authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to activate/deactivate.
 *         example: clx123abc456def789
 *     responses:
 *       '200':
 *         description: User activation status updated successfully. Returns the updated user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Bad Request - Invalid ID format.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User is not an admin.
 *       '404':
 *         description: Not Found - User with the specified ID not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.patch(
    '/activate/:id',
    roleMiddleware(['admin']), // Example: Restrict activation to admins
    userIdParamValidation,     // Validate the ID parameter
    UserController.activateUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     description: Permanently deletes a user account. Requires admin privileges and authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete.
 *         example: clx123abc456def789
 *     responses:
 *       '204':
 *         description: User deleted successfully. No content returned.
 *       '400':
 *         description: Bad Request - Invalid ID format.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User is not an admin.
 *       '404':
 *         description: Not Found - User with the specified ID not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.delete(
    '/:id',
    roleMiddleware(['admin']), // Example: Restrict deletion to admins
    userIdParamValidation,     // Validate the ID parameter
    UserController.deleteUser
);


export default router;
