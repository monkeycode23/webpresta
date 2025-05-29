import jwt from 'jsonwebtoken';
import Cliente from './models/cliente.js'; // Use Cliente model for authentication
import { io as mainIo } from './index.js'; // Importar la instancia \`io\` principal

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

/**
 * Envía una notificación a un usuario específico si está conectado.
 * @param {string} clienteId El ID del cliente que recibirá la notificación.
 * @param {object} notificationData Datos de la notificación (debe coincidir con la interfaz Notification del frontend).
 *                                  Ej: { id: uuidv4(), type: 'info', title: 'Título', message: 'Mensaje', timestamp: new Date().toISOString(), read: false, link?: '/ruta' }
 */
export function sendNotificationToUser(clienteId, notificationData) {
  if (!mainIo) { // Usar mainIo, la instancia exportada de index.js
    console.error('Socket.IO server (mainIo) not initialized in socketHandler.');
    return;
  }
  const socketId = getReceiverSocketId(clienteId);
  if (socketId) {
    console.log(`Sending notification to clienteId ${clienteId} (socketId ${socketId}):`, notificationData);
    mainIo.to(socketId).emit('new_notification', notificationData);
  } else {
    console.log(`Cliente ${clienteId} no conectado. Notificación no enviada en tiempo real.`);
    // Aquí podrías guardar la notificación en la BD para mostrarla cuando el usuario se conecte,
    // o si ya tienes un sistema de notificaciones persistentes, asegurar que se guarde.
  }
} 