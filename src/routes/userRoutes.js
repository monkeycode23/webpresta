import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { verificarToken, esAdmin } from '../middleware/authMiddleware.js'; // Asumiendo que tienes un middleware esAdmin

const router = Router();

// Rutas protegidas (solo para administradores)
router.post('/', [verificarToken, esAdmin], createUser);
router.get('/', [verificarToken, esAdmin], getUsers);
router.get('/:userId', [verificarToken, esAdmin], getUserById);
router.put('/:userId', [verificarToken, esAdmin], updateUser);
router.delete('/:userId', [verificarToken, esAdmin], deleteUser);

export default router; 