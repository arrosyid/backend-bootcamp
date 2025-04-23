import prisma from '../../prisma/prisma.js';
import { getAsync, setAsync, delAsync } from '../config/redis.js';
import { logger } from '../config/logger.js';
// Consider adding a password hashing library like bcrypt
// import bcrypt from 'bcrypt';

const USER_CACHE_TTL = 60; // Cache duration in seconds
const ALL_USERS_CACHE_KEY = 'users:all'; // Cache key for all users (for admin)

class UserService {

    /**
     * Gets users based on the requesting user's role.
     * Admins get all users (cached), regular users get their own profile.
     * @param {number} requestingUserId - The ID of the user making the request.
     * @param {string} requestingUserRole - The role of the user making the request.
     * @returns {Promise<object>} - Contains success status, data (user or users), and message.
     */
    async getUsers(requestingUserId, requestingUserRole) {
        try {
            if (requestingUserRole.toLowerCase() === 'admin') {
                // Admin: Try cache first
                let cachedUsers = await getAsync(ALL_USERS_CACHE_KEY);
                if (cachedUsers) {
                    logger.info('Cache hit for all users.');
                    return { success: true, data: JSON.parse(cachedUsers) };
                }

                // Cache miss: Fetch all users from DB
                logger.info('Cache miss for all users. Fetching from DB.');
                const users = await prisma.user.findMany({
                    // Exclude password from the result
                    select: { id: true, name: true, email: true, role: true, is_active: true, avatar: true }
                });
                await setAsync(ALL_USERS_CACHE_KEY, USER_CACHE_TTL, JSON.stringify(users));
                return { success: true, data: users };

            } else {
                // Regular user: Fetch their own profile
                const user = await prisma.user.findUnique({
                    where: { id: requestingUserId },
                    select: { id: true, name: true, email: true, role: true, is_active: true, avatar: true }
                });
                if (!user) {
                    logger.warn(`User not found with ID: ${requestingUserId}`);
                    return { success: false, status: 404, message: 'User not found' };
                }
                return { success: true, data: user };
            }
        } catch (error) {
            logger.error('Error fetching users:', { error: error.message, userId: requestingUserId, role: requestingUserRole });
            return { success: false, status: 500, message: 'Internal server error fetching users' };
        }
    }

     /**
     * Creates a new user.
     * @param {object} userData - User data (name, email, password, role).
     * @param {string|null} avatarFilename - The filename of the uploaded avatar, if any.
     * @returns {Promise<object>} - Contains success status, data (new user), and message.
     */
    async createUser(userData, avatarFilename) {
        const { name, email, password, role } = userData;
        try {
            // Check if email already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                logger.warn(`User creation failed: Email already exists - ${email}`);
                return { success: false, status: 400, message: 'Email already exists' };
            }

            // --- IMPORTANT: Hash password before saving ---
            // const hashedPassword = await bcrypt.hash(password, 10); // 10 is salt rounds

            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    // password: hashedPassword, // Store hashed password
                    password: password, // INSECURE: Storing plain text password
                    role,
                    is_active: false, // Default based on original logic
                    avatar: avatarFilename || null, // Store filename or null
                },
                select: { id: true, name: true, email: true, role: true, is_active: true, avatar: true } // Exclude password
            });

            logger.info(`User created successfully: ${newUser.id} (Email: ${email})`);
            // Invalidate cache
            await delAsync(ALL_USERS_CACHE_KEY);

            return { success: true, status: 201, data: newUser };

        } catch (error) {
            logger.error('Error creating user:', { error: error.message, email: email });
            return { success: false, status: 500, message: 'Internal server error creating user' };
        }
    }

    /**
     * Updates an existing user.
     * @param {number} userId - The ID of the user to update.
     * @param {object} updateData - Data to update (name, email, password, role).
     * @param {string|null} avatarFilename - The new avatar filename, or null if not changed.
     * @returns {Promise<object>} - Contains success status, data (updated user), and message.
     */
    async updateUser(userId, updateData, avatarFilename) {
        const { name, email, password, role } = updateData;
        try {
            // Check if user exists
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                logger.warn(`User update failed: User not found with ID ${userId}`);
                return { success: false, status: 404, message: 'User not found' };
            }

            // Check if email is being changed and if the new email already exists for another user
            if (email && email !== user.email) {
                const existingEmail = await prisma.user.findUnique({ where: { email } });
                if (existingEmail) {
                    logger.warn(`User update failed: Email ${email} already exists for another user.`);
                    return { success: false, status: 400, message: 'Email already exists' };
                }
            }

            const dataToUpdate = { name, email, role };

            // --- IMPORTANT: Hash password if it's being updated ---
            if (password) {
                 // const hashedPassword = await bcrypt.hash(password, 10);
                 // dataToUpdate.password = hashedPassword;
                 dataToUpdate.password = password; // INSECURE
            }

            // Update avatar filename if a new one was provided
            if (avatarFilename !== undefined) { // Check if explicitly passed (could be null to remove avatar)
                dataToUpdate.avatar = avatarFilename;
                // Optionally: Delete old avatar file from storage here if needed
            }


            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: dataToUpdate,
                select: { id: true, name: true, email: true, role: true, is_active: true, avatar: true } // Exclude password
            });

            logger.info(`User updated successfully: ${userId}`);
            // Invalidate caches
            await delAsync(ALL_USERS_CACHE_KEY);
            await delAsync(`user:${userId}`); // Invalidate specific user cache if you implement it

            return { success: true, data: updatedUser };

        } catch (error) {
            logger.error('Error updating user:', { error: error.message, userId: userId });
            return { success: false, status: 500, message: 'Internal server error updating user' };
        }
    }

    /**
     * Activates a user account.
     * @param {number} userId - The ID of the user to activate.
     * @returns {Promise<object>} - Contains success status and message.
     */
    async activateUser(userId) {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                logger.warn(`User activation failed: User not found with ID ${userId}`);
                return { success: false, status: 404, message: 'User not found' };
            }

            await prisma.user.update({
                where: { id: userId },
                data: { is_active: true },
            });

            logger.info(`User activated successfully: ${userId}`);
            // Invalidate caches
            await delAsync(ALL_USERS_CACHE_KEY);
            await delAsync(`user:${userId}`);

            return { success: true, message: 'User activated successfully' };

        } catch (error) {
            logger.error('Error activating user:', { error: error.message, userId: userId });
            return { success: false, status: 500, message: 'Internal server error activating user' };
        }
    }

    /**
     * Deletes a user.
     * @param {number} userId - The ID of the user to delete.
     * @returns {Promise<object>} - Contains success status and message.
     */
    async deleteUser(userId) {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                logger.warn(`User deletion failed: User not found with ID ${userId}`);
                return { success: false, status: 404, message: 'User not found' };
            }

            await prisma.user.delete({
                where: { id: userId },
            });

            logger.info(`User deleted successfully: ${userId}`);
            // Invalidate caches
            await delAsync(ALL_USERS_CACHE_KEY);
            await delAsync(`user:${userId}`);
            // Optionally: Delete user's avatar file from storage here

            return { success: true, message: 'User deleted successfully' };

        } catch (error) {
            // Handle potential foreign key constraints if user is linked elsewhere
             if (error.code === 'P2003') { // Prisma foreign key constraint error code
                 logger.error('Error deleting user: Foreign key constraint failed.', { error: error.message, userId: userId });
                 return { success: false, status: 400, message: 'Cannot delete user: User is associated with other data (e.g., tasks).' };
             }
            logger.error('Error deleting user:', { error: error.message, userId: userId });
            return { success: false, status: 500, message: 'Internal server error deleting user' };
        }
    }
}

export default new UserService();
