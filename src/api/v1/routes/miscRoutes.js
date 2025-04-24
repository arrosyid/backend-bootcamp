import express from 'express';
import MiscController from '../../../controllers/miscController.js';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import roleMiddleware from '../../../middlewares/roleMiddleware.js';
import { param } from 'express-validator'; // For math route validation

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Miscellaneous
 *   description: Various utility and test endpoints
 *
 * components:
 *   schemas:
 *     GenericMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Operation successful
 *     EncryptedData:
 *       type: object
 *       properties:
 *         encryptedData:
 *           type: string
 *           description: The encrypted data string.
 *           example: "aes-256-cbc:iv_base64:encrypted_base64"
 *     MathResult:
 *        type: object
 *        properties:
 *          result:
 *            type: number
 *            description: The result of the calculation.
 *            example: 15
 */

/**
 * @swagger
 * /api/v1/:
 *   get:
 *     summary: Root API endpoint
 *     tags: [Miscellaneous]
 *     description: Returns a welcome message for the v1 API.
 *     responses:
 *       '200':
 *         description: Welcome message.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericMessage'
 *               properties:
 *                 message:
 *                   example: Welcome to the API v1!
 */
router.get('/', MiscController.getRoot);

/**
 * @swagger
 * /api/v1/redis-test:
 *   get:
 *     summary: Test Redis connection
 *     tags: [Miscellaneous]
 *     description: Pings the Redis server to check the connection status.
 *     responses:
 *       '200':
 *         description: Redis connection successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericMessage'
 *               properties:
 *                 message:
 *                   example: Redis connection successful. PONG
 *       '500':
 *         description: Internal Server Error - Failed to connect to Redis.
 */
router.get('/redis-test', MiscController.testRedis);

/**
 * @swagger
 * /api/v1/metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     tags: [Miscellaneous]
 *     description: Returns application metrics in Prometheus format.
 *     responses:
 *       '200':
 *         description: Prometheus metrics data.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |-
 *                 # HELP nodejs_heap_size_total_bytes Total heap size in bytes.
 *                 # TYPE nodejs_heap_size_total_bytes gauge
 *                 nodejs_heap_size_total_bytes 23154688
 *                 # HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
 *                 # TYPE process_cpu_user_seconds_total counter
 *                 process_cpu_user_seconds_total 0.12
 *                 ...
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/metrics', MiscController.getMetrics);

/**
 * @swagger
 * /api/v1/grant-access:
 *   get:
 *     summary: Test role-based access control
 *     tags: [Miscellaneous]
 *     description: An endpoint accessible only by authenticated users with 'admin' or 'user' roles.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Access granted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericMessage'
 *               properties:
 *                 message:
 *                   example: Access granted to protected route.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '403':
 *         description: Forbidden - User does not have the required role (admin or user).
 *       '500':
 *         description: Internal Server Error.
 */
router.get(
    '/grant-access',
    authMiddleware,
    roleMiddleware(['admin', 'user']), // Roles defined in original code
    MiscController.grantAccess
);

/**
 * @swagger
 * /api/v1/secure-data:
 *   post:
 *     summary: Encrypt provided data
 *     tags: [Miscellaneous]
 *     description: Encrypts a given string using the server's encryption service.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: string
 *                 description: The plain text data to encrypt.
 *                 example: This is a secret message.
 *     responses:
 *       '200':
 *         description: Data encrypted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EncryptedData'
 *       '400':
 *         description: Bad Request - 'data' field is missing or invalid.
 *       '500':
 *         description: Internal Server Error during encryption.
 */
router.post('/secure-data', MiscController.secureData);

/**
 * @swagger
 * /api/v1/large-data:
 *   get:
 *     summary: Stream large data (Placeholder)
 *     tags: [Miscellaneous]
 *     description: Placeholder endpoint demonstrating how large data might be streamed. (Actual implementation may vary).
 *     responses:
 *       '200':
 *         description: Streamed data (e.g., CSV, JSON lines). Content-Type might be application/octet-stream or specific.
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/large-data', MiscController.streamLargeData);


// --- Simple Math Test Routes ---

/**
 * @swagger
 * /api/v1/tambah:
 *   get:
 *     summary: Add two numbers
 *     tags: [Miscellaneous]
 *     description: Adds two numbers provided as query parameters 'a' and 'b'.
 *     parameters:
 *       - in: query
 *         name: a
 *         schema:
 *           type: number
 *         required: true
 *         description: First number.
 *         example: 10
 *       - in: query
 *         name: b
 *         schema:
 *           type: number
 *         required: true
 *         description: Second number.
 *         example: 5
 *     responses:
 *       '200':
 *         description: Sum of the two numbers.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MathResult'
 *       '400':
 *         description: Bad Request - Missing or invalid query parameters.
 */
router.get('/tambah', MiscController.add);

/**
 * @swagger
 * /api/v1/kurang:
 *   get:
 *     summary: Subtract two numbers
 *     tags: [Miscellaneous]
 *     description: Subtracts number 'b' from number 'a', provided as query parameters.
 *     parameters:
 *       - in: query
 *         name: a
 *         schema:
 *           type: number
 *         required: true
 *         description: First number (minuend).
 *         example: 10
 *       - in: query
 *         name: b
 *         schema:
 *           type: number
 *         required: true
 *         description: Second number (subtrahend).
 *         example: 5
 *     responses:
 *       '200':
 *         description: Difference of the two numbers.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MathResult'
 *               properties:
 *                 result:
 *                   example: 5
 *       '400':
 *         description: Bad Request - Missing or invalid query parameters.
 */
router.get('/kurang', MiscController.subtract);

/**
 * @swagger
 * /api/v1/bagi/{a}/{b}:
 *   get:
 *     summary: Divide two numbers
 *     tags: [Miscellaneous]
 *     description: Divides number 'a' by number 'b', provided as path parameters.
 *     parameters:
 *       - in: path
 *         name: a
 *         schema:
 *           type: number
 *         required: true
 *         description: Dividend.
 *         example: 10
 *       - in: path
 *         name: b
 *         schema:
 *           type: number
 *         required: true
 *         description: Divisor.
 *         example: 2
 *     responses:
 *       '200':
 *         description: Quotient of the two numbers.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MathResult'
 *               properties:
 *                 result:
 *                   example: 5
 *       '400':
 *         description: Bad Request - Invalid path parameters (not numbers) or division by zero.
 */
const divideValidation = [
    param('a').isFloat().withMessage('Parameter "a" must be a number'),
    param('b').isFloat().withMessage('Parameter "b" must be a number')
];
router.get('/bagi/:a/:b', divideValidation, MiscController.divide);


// Note: The '/chat' route serving HTML is handled separately in app.js or a dedicated root router

export default router;
