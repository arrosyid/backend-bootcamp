import { logger } from '../config/logger.js';
import { generateSessionId } from '../utils/sessionUtils.js';

class ChatService {
    constructor() {
        // Store connected users: Map<socketId, { username, sessionId }>
        this.users = new Map();
        // Store active sessions: Map<sessionId, username>
        this.sessions = new Map();
        // Store the io instance once initialized
        this.io = null;
    }

    /**
     * Initializes the ChatService with the Socket.IO server instance
     * and sets up connection event listeners.
     * @param {object} io - The Socket.IO server instance.
     */
    initialize(io) {
        if (!io) {
            throw new Error("Socket.IO server instance is required for ChatService initialization.");
        }
        this.io = io;
        this.io.on('connection', (socket) => this.handleConnection(socket));
        logger.info('ChatService initialized and listening for Socket.IO connections.');
    }

    /**
     * Handles a new client connection.
     * @param {object} socket - The Socket.IO socket instance for the connected client.
     */
    handleConnection(socket) {
        logger.info(`Client connected: ${socket.id}`);

        socket.on('join', ({ username, sessionId }) => this.handleJoin(socket, username, sessionId));
        socket.on('message', (data) => this.handleMessage(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
        // Add listener for explicit leave/logout if needed
        // socket.on('leave', () => this.handleLeave(socket));
    }

    /**
     * Handles a user joining or rejoining the chat.
     * @param {object} socket - The client's socket instance.
     * @param {string} username - The username provided by the client.
     * @param {string|null} sessionId - The session ID provided by the client (for reconnection).
     */
    handleJoin(socket, username, sessionId) {
        let reconnected = false;
        let finalSessionId = sessionId;
        let finalUsername = username;

        // Attempt reconnection if session ID exists and is valid
        if (sessionId && this.sessions.has(sessionId)) {
            finalUsername = this.sessions.get(sessionId); // Use username stored in session
            this.users.set(socket.id, { username: finalUsername, sessionId: sessionId });
            reconnected = true;
            logger.info(`User reconnected: ${finalUsername} (Socket: ${socket.id}, Session: ${sessionId})`);

            // Notify other users
            socket.broadcast.emit('userReconnected', {
                username: finalUsername,
                message: `${finalUsername} reconnected to the chat`
            });

        } else {
            // New connection or invalid/expired session
            if (!username) {
                logger.warn(`Join attempt failed: Username not provided by socket ${socket.id}`);
                socket.emit('joinError', { message: 'Username is required to join.' });
                return;
            }
            finalSessionId = generateSessionId();
            this.users.set(socket.id, { username: finalUsername, sessionId: finalSessionId });
            this.sessions.set(finalSessionId, finalUsername);
            logger.info(`User joined: ${finalUsername} (Socket: ${socket.id}, Session: ${finalSessionId})`);

            // Notify all users
            this.io.emit('userJoined', {
                username: finalUsername,
                message: `${finalUsername} joined the chat`
            });
        }

        // Send session details back to the client
        socket.emit('sessionCreated', {
            sessionId: finalSessionId,
            username: finalUsername,
            reconnected: reconnected
        });

        // Optionally send list of currently connected users
        this.emitUserList();
    }

    /**
     * Handles an incoming chat message.
     * @param {object} socket - The sender's socket instance.
     * @param {object} data - The message data (should contain 'message' property).
     */
    handleMessage(socket, data) {
        const userInfo = this.users.get(socket.id);
        if (!userInfo) {
            logger.warn(`Message received from unknown socket: ${socket.id}`);
            return; // Ignore messages from sockets not in the user map
        }

        if (!data || typeof data.message !== 'string' || data.message.trim() === '') {
             logger.warn(`Invalid message format received from ${userInfo.username} (${socket.id})`);
             // Optionally notify the sender about the invalid message
             // socket.emit('messageError', { message: 'Invalid message format.' });
             return;
        }

        const username = userInfo.username;
        const messageContent = data.message.trim(); // Trim whitespace

        logger.info(`Message from ${username} (${socket.id}): ${messageContent}`);

        // Broadcast the message to all connected clients
        this.io.emit('message', {
            username: username,
            message: messageContent,
            timestamp: new Date()
        });
    }

    /**
     * Handles a client disconnection.
     * @param {object} socket - The disconnected client's socket instance.
     */
    handleDisconnect(socket) {
        const userInfo = this.users.get(socket.id);
        if (!userInfo) {
            // Could happen if disconnect occurs before join completes
            logger.info(`Client disconnected before joining: ${socket.id}`);
            return;
        }

        const { username, sessionId } = userInfo;
        this.users.delete(socket.id); // Remove user from active connections map

        logger.info(`User disconnected: ${username} (Socket: ${socket.id}, Session: ${sessionId})`);

        // Notify other users about disconnection
        this.io.emit('userDisconnected', {
            username: username,
            message: `${username} disconnected from the chat`
        });

        // Update and emit the user list
        this.emitUserList();

        // --- Session Cleanup ---
        // Check if any other socket is using the same session ID (unlikely but possible)
        const isSessionStillActive = Array.from(this.users.values()).some(user => user.sessionId === sessionId);

        if (!isSessionStillActive) {
            // Set a timeout to remove the session if the user doesn't reconnect
            logger.info(`Starting 60s reconnection timeout for session ${sessionId} (${username})`);
            setTimeout(() => {
                // Check again if the session is active after the timeout
                const isSessionReconnected = Array.from(this.users.values()).some(user => user.sessionId === sessionId);
                if (!isSessionReconnected && this.sessions.has(sessionId)) {
                    this.sessions.delete(sessionId);
                    logger.info(`Cleaned up abandoned session ${sessionId} for user ${username}`);
                    // Notify that the user has fully left after timeout
                    this.io.emit('userLeft', {
                        username: username,
                        message: `${username} left the chat`
                    });
                     this.emitUserList(); // Update list again after final leave
                }
            }, 60000); // 60 seconds timeout
        }
    }

    /**
     * Emits the current list of connected usernames to all clients.
     */
    emitUserList() {
         if (this.io) {
            const usernames = Array.from(this.users.values()).map(u => u.username);
            // Use a Set to get unique usernames if multiple connections per user are possible
            const uniqueUsernames = [...new Set(usernames)];
            this.io.emit('userList', uniqueUsernames);
            logger.debug('Emitted updated user list:', uniqueUsernames);
         }
    }

    // Optional: Handle explicit leave/logout
    // handleLeave(socket) {
    //     const userInfo = this.users.get(socket.id);
    //     if (userInfo) {
    //         const { username, sessionId } = userInfo;
    //         logger.info(`User explicitly left: ${username} (Socket: ${socket.id}, Session: ${sessionId})`);
    //         this.users.delete(socket.id);
    //         this.sessions.delete(sessionId); // Remove session immediately on explicit leave
    //         this.io.emit('userLeft', {
    //             username: username,
    //             message: `${username} left the chat`
    //         });
    //         this.emitUserList();
    //     }
    // }
}

// Export a single instance of the service
export default new ChatService();
