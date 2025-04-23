import express from 'express';
import TaskController, {
    taskIdParamValidation,
    createTaskValidation,
    updateTaskValidation
} from '../../../controllers/taskController.js'; // Corrected path
import authMiddleware from '../../../middlewares/authMiddleware.js'; // Corrected path
// Role middleware isn't strictly needed here as ownership is checked in the service/controller

const router = express.Router();

// Apply auth middleware to all task routes
router.use(authMiddleware);

/**
 * @route   GET /api/v1/tasks
 * @desc    Get all tasks for the authenticated user
 * @access  Private
 */
router.get('/', TaskController.getTasks);

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task for the authenticated user
 * @access  Private
 */
router.post(
    '/',
    createTaskValidation, // Validate request body
    TaskController.createTask
);

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update a task owned by the authenticated user
 * @access  Private
 */
router.put(
    '/:id',
    updateTaskValidation, // Validate param and body
    TaskController.updateTask
);

/**
 * @route   PATCH /api/v1/tasks/done/:id
 * @desc    Mark a task as done
 * @access  Private
 */
router.patch(
    '/done/:id',
    taskIdParamValidation, // Validate the ID parameter
    TaskController.markTaskAsDone
);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task owned by the authenticated user
 * @access  Private
 */
router.delete(
    '/:id',
    taskIdParamValidation, // Validate the ID parameter
    TaskController.deleteTask
);

export default router;
