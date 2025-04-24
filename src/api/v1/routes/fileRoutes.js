import express from 'express';
import FileController, { filenameParamValidation } from '../../../controllers/fileController.js'; // Corrected path
import authMiddleware from '../../../middlewares/authMiddleware.js'; // Corrected path
import upload from '../../../config/multer.js'; // Corrected path
import { handleMulterError } from '../../../middlewares/errorMiddleware.js'; // Corrected path

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and retrieval operations
 *
 * components:
 *   schemas:
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: File uploaded successfully
 *         filename:
 *           type: string
 *           description: The name of the uploaded file as stored on the server.
 *           example: 1713952082000-document.pdf
 *         url:
 *           type: string
 *           format: url
 *           description: The URL to access the uploaded file.
 *           example: http://localhost:3000/uploads/1713952082000-document.pdf
 */

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     description: Uploads a single file to the server. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (e.g., image, document). Max size depends on server config (likely 2MB from Multer default).
 *     responses:
 *       '201':
 *         description: File uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       '400':
 *         description: Bad Request - No file provided, file type not allowed, or file size exceeded limit.
 *       '401':
 *         description: Unauthorized - JWT token is missing or invalid.
 *       '500':
 *         description: Internal Server Error during file processing or saving.
 */
router.post(
    '/upload',
    authMiddleware,           // Ensure user is logged in to upload
    upload.single('file'),    // Handle single file upload named 'file'
    handleMulterError,        // Handle Multer errors specifically
    FileController.uploadFile // Controller method after successful upload
);

/**
 * @swagger
 * /api/v1/files/{filename}:
 *   get:
 *     summary: Retrieve an uploaded file
 *     tags: [Files]
 *     description: Downloads or displays an uploaded file based on its filename. Access is currently public.
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the file as stored on the server (including timestamp/unique identifier if applicable).
 *         example: 1713952082000-document.pdf
 *     responses:
 *       '200':
 *         description: File content. The Content-Type header will vary based on the file type.
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *              schema:
 *                type: string
 *                format: binary
 *           application/octet-stream: # Fallback for other types
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: Bad Request - Invalid filename format.
 *       '404':
 *         description: Not Found - File with the specified filename does not exist.
 *       '500':
 *         description: Internal Server Error.
 */
router.get(
    '/:filename',
    filenameParamValidation, // Validate filename format
    FileController.getFile
);

export default router;
