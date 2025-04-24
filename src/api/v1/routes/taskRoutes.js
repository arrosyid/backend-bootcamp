import express from 'express';
import TaskController, {
    taskIdParamValidation,
    createTaskValidation,
    updateTaskValidation
} from '../../../controllers/taskController.js'; // Corrected path
import authMiddleware from '../../../middlewares/authMiddleware.js'; // Corrected path
// Role middleware isn't strictly needed here as ownership is checked in the service/controller

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management operations for authenticated users
 *
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the task
 *           example: cly456xyz789abc123
 *         title:
 *           type: string
 *           description: Task title
 *           example: Implement Swagger UI
 *         description:
 *           type: string
 *           description: Optional task description
 *           example: Add JSDoc comments to all route files.
 *         isDone:
 *           type: boolean
 *           description: Task completion status
 *           example: false
 *         userId:
 *           type: string
 *           description: ID of the user who owns the task
 *           example: clx123abc456def789
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of task creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last task update
 *     TaskInputRequired:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           example: Write unit tests
 *         description:
 *           type: string
 *           example: Cover critical functions in authService.
 *     TaskInputOptional:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: Update unit tests
 *         description:
 *           type: string
 *           example: Refactor tests for new login flow.
 *         isDone:
 *           type: boolean
 *           example: true
 */

// Apply auth middleware to all task routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Retrieve tasks for the authenticated user
 *     tags: [Tasks]
 *     description: Fetches a list of all tasks belonging to the currently logged-in user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of tasks.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/', TaskController.getTasks);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     description: Creates a new task for the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInputRequired'
 *     responses:
 *       '201':
 *         description: Task created successfully. Returns the created task object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       '400':
 *         description: Bad Request - Invalid input data (e.g., missing title).
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '500':
 *         description: Internal Server Error.
 */
router.post(
    '/',
    createTaskValidation, // Validate request body
    TaskController.createTask
);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update an existing task
 *     tags: [Tasks]
 *     description: Updates an existing task owned by the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update.
 *         example: cly456xyz789abc123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInputOptional' # Use optional schema for updates
 *     responses:
 *       '200':
 *         description: Task updated successfully. Returns the updated task object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       '400':
 *         description: Bad Request - Invalid input data or invalid ID format.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User does not own this task.
 *       '404':
 *         description: Not Found - Task with the specified ID not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.put(
    '/:id',
    updateTaskValidation, // Validate param and body
    TaskController.updateTask
);

/**
 * @swagger
 * /api/v1/tasks/done/{id}:
 *   patch:
 *     summary: Mark a task as done
 *     tags: [Tasks]
 *     description: Marks a specific task owned by the authenticated user as completed (sets isDone to true). Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to mark as done.
 *         example: cly456xyz789abc123
 *     responses:
 *       '200':
 *         description: Task marked as done successfully. Returns the updated task object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       '400':
 *         description: Bad Request - Invalid ID format.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User does not own this task.
 *       '404':
 *         description: Not Found - Task with the specified ID not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.patch(
    '/done/:id',
    taskIdParamValidation, // Validate the ID parameter
    TaskController.markTaskAsDone
);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     description: Deletes a specific task owned by the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to delete.
 *         example: cly456xyz789abc123
 *     responses:
 *       '204':
 *         description: Task deleted successfully. No content returned.
 *       '400':
 *         description: Bad Request - Invalid ID format.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User does not own this task.
 *       '404':
 *         description: Not Found - Task with the specified ID not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.delete(
    '/:id',
    taskIdParamValidation, // Validate the ID parameter
    TaskController.deleteTask
);

export default router;
