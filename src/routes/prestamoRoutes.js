import { Router } from 'express';
import { 
  getPrestamoById, 
  getDetallePrestamoConPagos, 
  getPagosPrestamo,
  createPrestamo,
  updatePrestamo,
  deletePrestamo
} from '../controllers/prestamoController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Middleware para verificar que el cliente es dueño del préstamo
const verificarDuenoPrestamo = async (req, res, next) => {
  try {
    const prestamoId = req.params.id || req.params.prestamoId;
    const clienteId = req.clienteId.toString();
    
    // Importar modelo de Prestamo
    const Prestamo = (await import('../models/prestamo.js')).default;
    
    // Buscar el préstamo
    const prestamo = await Prestamo.findById(prestamoId);
    
    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }
    
    // Verificar que el cliente es dueño del préstamo
    if (prestamo.cliente.toString() !== clienteId) {
      return res.status(403).json({ 
        mensaje: 'No tienes permiso para acceder a este préstamo' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error al verificar dueño del préstamo:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Rutas protegidas
router.post('/', verificarToken, createPrestamo);
router.get('/:prestamoId', verificarToken, getPrestamoById);
router.put('/:prestamoId', verificarToken, updatePrestamo);
router.delete('/:prestamoId', verificarToken, deletePrestamo);
router.get('/:prestamoId/detalle', verificarToken, getDetallePrestamoConPagos);
router.get('/:prestamoId/pagos', verificarToken, getPagosPrestamo);

export default router; 