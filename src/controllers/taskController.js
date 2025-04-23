import TaskService from '../services/taskService.js';
import { body, param, validationResult } from 'express-validator';
import { logger } from '../config/logger.js';

// Validation rules
const taskIdParamValidation = [
    param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
];

const createTaskValidation = [
    body('tittle').notEmpty().withMessage('Title is required').trim(),
    body('description').notEmpty().withMessage('Description is required').trim(),
];

const updateTaskValidation = [
    param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
    body('tittle').notEmpty().withMessage('Title is required').trim(),
    body('description').notEmpty().withMessage('Description is required').trim(),
];


class TaskController {

    /**
     * GET /api/v1/tasks
     * Gets all tasks for the authenticated user.
     */
    async getTasks(req, res, next) {
        try {
            const userId = req.user.id; // Assumes authMiddleware populates req.user
            const result = await TaskService.getTasksByUser(userId);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data
                });
            } else {
                // Service layer handles errors like DB issues
                res.status(result.status || 500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            logger.error('Error in TaskController getTasks:', { error: error.message });
            next(error);
        }
    }

    /**
     * POST /api/v1/tasks
     * Creates a new task for the authenticated user.
     */
    async createTask(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.user.id;
            const taskData = req.body;

            const result = await TaskService.createTask(userId, taskData);

            if (result.success) {
                res.status(result.status).json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(result.status).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            logger.error('Error in TaskController createTask:', { error: error.message });
            next(error);
        }
    }

    /**
     * PUT /api/v1/tasks/:id
     * Updates a task owned by the authenticated user.
     */
    async updateTask(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const taskId = parseInt(req.params.id);
            const userId = req.user.id;
            const updateData = req.body;

            const result = await TaskService.updateTask(taskId, userId, updateData);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(result.status).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            logger.error('Error in TaskController updateTask:', { error: error.message });
            next(error);
        }
    }

    /**
     * PATCH /api/v1/tasks/done/:id
     * Marks a task as done for the authenticated user.
     */
    async markTaskAsDone(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const taskId = parseInt(req.params.id);
            const userId = req.user.id;

            const result = await TaskService.markTaskAsDone(taskId, userId);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(result.status).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            logger.error('Error in TaskController markTaskAsDone:', { error: error.message });
            next(error);
        }
    }

    /**
     * DELETE /api/v1/tasks/:id
     * Deletes a task owned by the authenticated user.
     */
    async deleteTask(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const taskId = parseInt(req.params.id);
            const userId = req.user.id;

            const result = await TaskService.deleteTask(taskId, userId);

            if (result.success) {
                res.status(200).json({ // Or 204 No Content
                    success: true,
                    message: result.message
                });
            } else {
                res.status(result.status).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            logger.error('Error in TaskController deleteTask:', { error: error.message });
            next(error);
        }
    }
}

export {
    taskIdParamValidation,
    createTaskValidation,
    updateTaskValidation
};
export default new TaskController();
