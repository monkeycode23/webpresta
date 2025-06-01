import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: { // Para notificaciones a usuarios administradores/staff
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  client_id: { // Para notificaciones a clientes
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
  },
  sender_user_id: { // El usuario que originó la notificación
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }, 
  type: {
    type: String,
    required: true,
    
  },
  message: {
    type: String,
    required: true,
  },
  link: { // Enlace opcional a un recurso (ej. /prestamos/:id)
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices para mejorar el rendimiento de las consultas
notificationSchema.index({ user_id: 1, read: 1, created_at: -1 });
notificationSchema.index({ client_id: 1, read: 1, created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 