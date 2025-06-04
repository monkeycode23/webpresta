import { Router } from 'express';
import {
  createNotification,
  getNotificationsForUser,
  getNotificationsForClient,
  markNotificationAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Crear una notificación (probablemente una acción interna del sistema o admin)
router.post('/', [verificarToken], createNotification); // Proteger según quién puede crear notificaciones

// Obtener notificaciones para el usuario autenticado (admin/staff)
router.get('/user', [verificarToken], getNotificationsForUser);

// Obtener notificaciones para el cliente autenticado
// Se podría usar un endpoint específico o el mismo que /user y diferenciar por rol en el controlador
router.get('/client', [verificarToken], getNotificationsForClient);

// Marcar una notificación como leída
router.post('/mark-read', [verificarToken], markNotificationAsRead);

// Eliminar una notificación
router.delete('/:notificationId', [verificarToken], deleteNotification);


router.put('/create',[verificarToken],createNotification)

export default router; 