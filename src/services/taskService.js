import prisma from '../../prisma/prisma.js';
import { logger } from '../config/logger.js';

class TaskService {

    /**
     * Gets all tasks for a specific user.
     * @param {number} userId - The ID of the user whose tasks are being requested.
     * @returns {Promise<object>} - Contains success status, data (tasks), and message.
     */
    async getTasksByUser(userId) {
        try {
            logger.info(`Fetching tasks for user ID: ${userId}`);
            const tasks = await prisma.task.findMany({
                where: { userId: userId },
                orderBy: { createdAt: 'desc' } // Optional: order by creation date
            });
            logger.info(`Successfully retrieved ${tasks.length} tasks for user ID: ${userId}`);
            return { success: true, data: tasks };
        } catch (error) {
            logger.error('Error fetching tasks:', { error: error.message, userId: userId });
            return { success: false, status: 500, message: 'Internal server error fetching tasks' };
        }
    }

    /**
     * Creates a new task for a specific user.
     * @param {number} userId - The ID of the user creating the task.
     * @param {object} taskData - Task data (tittle, description).
     * @returns {Promise<object>} - Contains success status, data (new task), and message.
     */
    async createTask(userId, taskData) {
        const { tittle, description } = taskData;
        try {
            // Optional: Check if a task with the same title already exists for the user
            // const existingTask = await prisma.task.findFirst({
            //     where: { userId: userId, tittle: tittle }
            // });
            // if (existingTask) {
            //     logger.warn(`Task creation failed: Title "${tittle}" already exists for user ID ${userId}`);
            //     return { success: false, status: 400, message: 'Task with this title already exists' };
            // }

            const newTask = await prisma.task.create({
                data: {
                    userId: userId,
                    tittle: tittle,
                    description: description,
                    is_done: false // Default value
                }
            });
            logger.info(`Task created successfully for user ID ${userId}: ${newTask.id}`);
            return { success: true, status: 201, data: newTask };
        } catch (error) {
            logger.error('Error creating task:', { error: error.message, userId: userId, tittle: tittle });
            return { success: false, status: 500, message: 'Internal server error creating task' };
        }
    }

    /**
     * Updates an existing task.
     * @param {number} taskId - The ID of the task to update.
     * @param {number} userId - The ID of the user requesting the update (for authorization).
     * @param {object} updateData - Data to update (tittle, description).
     * @returns {Promise<object>} - Contains success status, data (updated task), and message.
     */
    async updateTask(taskId, userId, updateData) {
        const { tittle, description } = updateData;
        try {
            // First, verify the task exists and belongs to the user
            const task = await prisma.task.findUnique({
                where: { id: taskId }
            });

            if (!task) {
                logger.warn(`Task update failed: Task not found with ID ${taskId}`);
                return { success: false, status: 404, message: 'Task not found' };
            }

            if (task.userId !== userId) {
                logger.warn(`Task update failed: User ${userId} does not own task ${taskId}`);
                return { success: false, status: 403, message: 'Forbidden: You do not have permission to update this task' };
            }

            // Perform the update
            const updatedTask = await prisma.task.update({
                where: { id: taskId },
                data: {
                    tittle: tittle,
                    description: description
                    // Note: is_done is handled by markTaskAsDone
                }
            });
            logger.info(`Task updated successfully: ${taskId}`);
            return { success: true, data: updatedTask };
        } catch (error) {
            logger.error('Error updating task:', { error: error.message, taskId: taskId, userId: userId });
            return { success: false, status: 500, message: 'Internal server error updating task' };
        }
    }

    /**
     * Marks a task as done.
     * @param {number} taskId - The ID of the task to mark as done.
     * @param {number} userId - The ID of the user requesting the update (for authorization).
     * @returns {Promise<object>} - Contains success status, data (updated task), and message.
     */
    async markTaskAsDone(taskId, userId) {
        try {
            // Verify the task exists and belongs to the user
            const task = await prisma.task.findUnique({
                where: { id: taskId }
            });

            if (!task) {
                logger.warn(`Mark task done failed: Task not found with ID ${taskId}`);
                return { success: false, status: 404, message: 'Task not found' };
            }

            if (task.userId !== userId) {
                logger.warn(`Mark task done failed: User ${userId} does not own task ${taskId}`);
                return { success: false, status: 403, message: 'Forbidden: You do not have permission to modify this task' };
            }

            // Update the task status
            const updatedTask = await prisma.task.update({
                where: { id: taskId },
                data: { is_done: true }
            });
            logger.info(`Task marked as done successfully: ${taskId}`);
            return { success: true, data: updatedTask };
        } catch (error) {
            logger.error('Error marking task as done:', { error: error.message, taskId: taskId, userId: userId });
            return { success: false, status: 500, message: 'Internal server error marking task as done' };
        }
    }

    /**
     * Deletes a task.
     * @param {number} taskId - The ID of the task to delete.
     * @param {number} userId - The ID of the user requesting the deletion (for authorization).
     * @returns {Promise<object>} - Contains success status and message.
     */
    async deleteTask(taskId, userId) {
        try {
            // Verify the task exists and belongs to the user
            const task = await prisma.task.findUnique({
                where: { id: taskId }
            });

            if (!task) {
                logger.warn(`Task deletion failed: Task not found with ID ${taskId}`);
                return { success: false, status: 404, message: 'Task not found' };
            }

            if (task.userId !== userId) {
                logger.warn(`Task deletion failed: User ${userId} does not own task ${taskId}`);
                return { success: false, status: 403, message: 'Forbidden: You do not have permission to delete this task' };
            }

            // Delete the task
            await prisma.task.delete({
                where: { id: taskId }
            });
            logger.info(`Task deleted successfully: ${taskId}`);
            return { success: true, message: 'Task deleted successfully' };
        } catch (error) {
            logger.error('Error deleting task:', { error: error.message, taskId: taskId, userId: userId });
            return { success: false, status: 500, message: 'Internal server error deleting task' };
        }
    }
}

export default new TaskService();
