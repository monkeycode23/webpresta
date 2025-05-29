import jwt from 'jsonwebtoken';
import Cliente from './models/cliente.js'; // Use Cliente model for authentication

const connectedUsers = new Map(); // Map to store clienteID -> socketID
const JWT_SECRET = process.env.JWT_SECRET || 'prestaweb-secret-key'; // Align with authMiddleware



export default function initializeSocket(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.clienteId = decoded.id; // Assuming JWT payload from your auth has 'id' for Cliente
        
        const cliente = await Cliente.findById(socket.clienteId);
        if (!cliente) {
          return next(new Error('Authentication error: Client not found.'));
        }
        // You might want to check if cliente.activo here as well
        next();
      } catch (err) {
        console.error('Socket authentication error:', err.message);
        return next(new Error('Authentication error'));
      }
    } else {
      console.warn('Socket connection without token. Proceeding as anonymous for now.');
      // For a fully featured chat, you would typically require authentication.
      // To enforce auth, uncomment and modify: return next(new Error('Authentication error: Token not provided'));
      next(); 
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}, ClienteID: ${socket.clienteId || 'Anonymous'}`);

    if (socket.clienteId) {
      connectedUsers.set(socket.clienteId.toString(), socket.id);
      console.log('Connected clients:', Array.from(connectedUsers.keys()));
      io.emit('userOnlineStatus', { userId: socket.clienteId, isOnline: true, onlineUsers: Array.from(connectedUsers.keys()) });
    }

    socket.on('sendMessage', (data) => {
      // data should include: { receiverId: string (clienteId), content: string }
      console.log('sendMessage event received:', data, 'from clienteId:', socket.clienteId);
      // Further implementation will go here: save message, emit to receiver, create notification.
    });

    socket.on('typing', (data) => {
       console.log('typing event received:', data);
       // const receiverSocketId = connectedUsers.get(data.receiverId.toString());
       // if (receiverSocketId) io.to(receiverSocketId).emit('userTyping', { senderId: socket.clienteId, isTyping: data.isTyping });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}, ClienteID: ${socket.clienteId || 'Anonymous'}`);
      if (socket.clienteId) {
        connectedUsers.delete(socket.clienteId.toString());
        console.log('Connected clients after disconnect:', Array.from(connectedUsers.keys()));
        io.emit('userOnlineStatus', { userId: socket.clienteId, isOnline: false, onlineUsers: Array.from(connectedUsers.keys()) });
      }
    });
  });
}

export function getReceiverSocketId(receiverId) {
  return connectedUsers.get(receiverId.toString());
} 