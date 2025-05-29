import Notification from '../models/notification.js';
import { getReceiverSocketId } from '../socketHandler.js'; // Asumiendo que esta función existe y está exportada
import { io } from '../index.js'; // Importar la instancia de io desde index.js

// Crear una nueva notificación
export const createNotification = async (req, res) => {
  try {
    const { user_id, client_id, type, message, link } = req.body;
    const sender_user_id = req.user.id; // Asumiendo que el ID del usuario logueado está en req.user.id

    if (!user_id && !client_id) {
      return res.status(400).json({ message: 'Se requiere user_id o client_id' });
    }

    const newNotification = new Notification({
      user_id,
      client_id,
      sender_user_id,
      type,
      message,
      link
    });

    const savedNotification = await newNotification.save();

    // Enviar notificación por socket si el destinatario está conectado
    let targetSocketId;
    if (client_id) {
      targetSocketId = getReceiverSocketId(client_id.toString());
      if (targetSocketId && io) {
        io.to(targetSocketId).emit('new_notification', savedNotification);
        console.log(`Notificación enviada por socket a cliente ${client_id}`);
      }
    } else if (user_id) {
      // Asumimos que los User (admins/staff) también pueden tener sockets. Necesitaríamos una lógica similar a connectedUsers para ellos.
      // Por ahora, esto es un placeholder. Deberías extender socketHandler.js para manejar User sessions.
      targetSocketId = getReceiverSocketId(user_id.toString()); // Esto podría necesitar una `connectedAdmins` map
      if (targetSocketId && io) {
        io.to(targetSocketId).emit('new_notification', savedNotification);
        console.log(`Notificación enviada por socket a usuario ${user_id}`);
      }
    }

    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ message: 'Error del servidor al crear notificación', error: error.message });
  }
};

// Obtener notificaciones para un usuario (admin/staff)
export const getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.user.id; // ID del usuario autenticado
    const notifications = await Notification.find({ user_id: userId }).sort({ created_at: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones del usuario', error: error.message });
  }
};

// Obtener notificaciones para un cliente
export const getNotificationsForClient = async (req, res) => {
  try {
    const clientId = req.clienteId; // ID del cliente autenticado (asumiendo que authMiddleware lo añade)
    const notifications = await Notification.find({ client_id: clientId }).sort({ created_at: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones del cliente', error: error.message });
  }
};

// Marcar una notificación como leída
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    // Aquí deberías verificar que la notificación pertenece al usuario/cliente autenticado antes de marcarla
    const notification = await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificación como leída', error: error.message });
  }
};

// Eliminar una notificación
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    // Aquí deberías verificar que la notificación pertenece al usuario/cliente autenticado antes de eliminarla
    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    res.json({ message: 'Notificación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar notificación', error: error.message });
  }
}; 