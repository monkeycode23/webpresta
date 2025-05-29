import { Router } from 'express';
import { 
  getPagoById, 
  getHistorialPagosCliente, 
  getPagosPendientesCliente, 
  createPago, 
  updatePago, 
  deletePago, 
  getFilteredUserPayments 
} from '../controllers/pagoController.js';
import { verificarToken, verificarPropietario } from '../middleware/authMiddleware.js';

const router = Router();

// Middleware para verificar que el cliente es dueño del pago
const verificarDuenoPago = async (req, res, next) => {
  try {
    const pagoId = req.params.id;
    const clienteId = req.clienteId.toString();
    
    // Importar modelo de Pago
    const Pago = (await import('../models/pago.js')).default;
    
    // Buscar el pago
    const pago = await Pago.findById(pagoId);
    
    if (!pago) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }
    
    // Verificar que el cliente es dueño del pago
    if (pago.cliente.toString() !== clienteId) {
      return res.status(403).json({ 
        mensaje: 'No tienes permiso para acceder a este pago' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error al verificar dueño del pago:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Ruta para obtener pago por ID (protegida)
router.get('/:id', [verificarToken, verificarDuenoPago], getPagoById);

// Ruta para obtener historial de pagos por cliente (protegida)
router.get('/cliente/:clienteId/historial', [verificarToken, verificarPropietario], getHistorialPagosCliente);

// Ruta para obtener pagos pendientes por cliente (protegida)
router.get('/cliente/:clienteId/pendientes', [verificarToken, verificarPropietario], getPagosPendientesCliente);

// Rutas protegidas
router.post('/', verificarToken, createPago);
router.put('/:pagoId', verificarToken, updatePago);
router.delete('/:pagoId', verificarToken, deletePago);

// Nueva ruta para obtener pagos filtrados del usuario autenticado
// GET /api/pagos/my-payments?page=1&limit=10&status=pendiente&sortBy=payment_date&sortOrder=desc
router.get('/my-payments', verificarToken, getFilteredUserPayments);

export default router; 