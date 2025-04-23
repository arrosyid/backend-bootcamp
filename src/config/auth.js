// It's highly recommended to store secrets like this in environment variables
// instead of hardcoding them in the source file.
// Example using environment variable:
// export const jwtSecret = process.env.JWT_SECRET || 'default-fallback-secret';

export const jwtSecret = 'secret'; // The original secret from app_server.js
export const jwtExpiresIn = '1h'; // Token expiration time
