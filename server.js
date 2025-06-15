const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });
const rooms = new Map(); // Store active rooms and their participants

console.log('WebRTC Signaling Server running on ws://localhost:8080');

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type);

            switch (data.type) {
                case 'create':
                    handleCreateRoom(ws, data);
                    break;
                case 'join':
                    handleJoinRoom(ws, data);
                    break;
                case 'offer':
                case 'answer':
                case 'candidate':
                case 'call-end':
                case 'chat':
                    forwardMessage(data);
                    break;
                default:
                    console.warn('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        cleanupDisconnectedClient(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        cleanupDisconnectedClient(ws);
    });
});

function handleCreateRoom(ws, data) {
    const roomId = data.roomId || uuidv4();
    const userId = uuidv4();

    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }

    const room = rooms.get(roomId);
    if (room.size >= 2) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room is full (max 2 participants)'
        }));
        return;
    }

    // Store WebSocket with user metadata
    ws.userData = { roomId, userId, isInitiator: room.size === 0 };
    room.add(ws);

    ws.send(JSON.stringify({
        type: 'created',
        roomId,
        userId,
        isInitiator: ws.userData.isInitiator
    }));

    console.log(`Room ${roomId} created. Participants: ${room.size}`);
}

function handleJoinRoom(ws, data) {
    const roomId = data.roomId;
    const userId = uuidv4();

    if (!rooms.has(roomId)) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room does not exist'
        }));
        return;
    }

    const room = rooms.get(roomId);
    if (room.size >= 2) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room is full (max 2 participants)'
        }));
        return;
    }

    // Store WebSocket with user metadata
    ws.userData = { roomId, userId, isInitiator: false };
    room.add(ws);

    // Notify both clients about the new participant
    room.forEach(client => {
        client.send(JSON.stringify({
            type: 'joined',
            roomId,
            userId,
            isInitiator: client.userData.isInitiator,
            participants: Array.from(room).map(c => c.userData.userId)
        }));
    });

    console.log(`User ${userId} joined room ${roomId}. Participants: ${room.size}`);
}

function forwardMessage(data) {
    const roomId = data.roomId;

    if (!rooms.has(roomId)) {
        console.warn(`Attempt to send message to non-existent room: ${roomId}`);
        return;
    }

    const room = rooms.get(roomId);
    room.forEach(client => {
        // Don't send the message back to the sender
        if (client.userData.userId !== data.senderId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function cleanupDisconnectedClient(ws) {
    if (!ws.userData) return;

    const { roomId, userId } = ws.userData;
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.delete(ws);

    // Notify remaining participant about the disconnection
    if (room.size > 0) {
        room.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'participant-left',
                    userId
                }));
            }
        });
    } else {
        // Clean up empty rooms
        rooms.delete(roomId);
    }

    console.log(`User ${userId} disconnected from room ${roomId}. Remaining: ${room.size}`);
}

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('Shutting down signaling server...');
    wss.clients.forEach(client => {
        client.close();
    });
    wss.close();
    process.exit();
});
