# backend-bootcamp

## Description

This project is a learning exercise focused on exploring backend development concepts using Node.js and Express.js. It serves as a practical playground for understanding REST APIs, middleware, database interactions, real-time communication, and various supporting tools within the Node.js ecosystem. The primary goal is exploration and practice rather than building a specific, feature-complete application.

## Concepts Explored

This project touches upon various backend development concepts, including:

*   **Express.js:** Routing, Middleware implementation (request logging, error handling, authentication).
*   **RESTful API Design:** Creating structured API endpoints for different resources.
*   **Prisma ORM:** Interacting with a database (schema definition, migrations, queries).
*   **Redis:** Using Redis (via `ioredis`) potentially for caching or session management.
*   **JSON Web Tokens (JWT):** Implementing token-based authentication.
*   **Socket.IO:** Enabling real-time, bidirectional communication between client and server.
*   **Input Validation:** Using `express-validator` to validate incoming request data.
*   **Rate Limiting:** Implementing request limits using `express-rate-limit`.
*   **Logging:** Setting up application logging with `Winston` and `winston-daily-rotate-file`.
*   **Testing:** Writing unit/integration tests using `Jest` and `Supertest`.
*   **File Uploads:** Handling file uploads using `Multer`.
*   **API Documentation:** Generating API documentation using `swagger-jsdoc` and `swagger-ui-express`.
*   **Environment Management:** Using `dotenv` for configuration (though noted as not strictly required for basic local running in this case).
*   **Asynchronous Operations:** Handling async code effectively.

## Technologies Used

*   **Framework:** `Express.js`
*   **Database ORM:** `Prisma`
*   **Database:** MySQL (implied by `mysql2` driver)
*   **In-Memory Store:** Redis (`ioredis`)
*   **Real-time Communication:** `Socket.IO`
*   **Authentication:** JSONWebToken (`jsonwebtoken`)
*   **Validation:** `express-validator`
*   **Logging:** `Winston`, `express-winston`, `morgan`
*   **File Uploads:** `Multer`
*   **Rate Limiting:** `express-rate-limit`
*   **Testing:** `Jest`, `Supertest`
*   **Development:** `Nodemon`
*   **Package Manager:** `pnpm`
*   **Transpiling (for Jest):** `Babel` (`@babel/core`, `@babel/preset-env`, `babel-jest`)
*   **API Documentation:** `Swagger UI` (accessible at `http://localhost:3000/api-docs`)
*   **Other:** `cors`, `dotenv`, `prom-client`

## API Structure

The API routes are organized under `src/api/v1/routes/`. Key route modules include:

*   `authRoutes.js`
*   `fileRoutes.js`
*   `miscRoutes.js`
*   `taskRoutes.js`
*   `userRoutes.js`

Explore these files and the corresponding controllers in `src/controllers/` to understand the available endpoints.

