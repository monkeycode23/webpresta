import { Router } from 'express';
import { 
  getClienteById, 
  getPrestamosCliente, 
  getPagosCliente, 
  getResumenCliente,
  getClienteByDocumento,
  createCliente,
  updateCliente,
  deleteCliente
} from '../controllers/clienteController.js';
import { verificarToken, verificarPropietario } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.post('/', createCliente);

// Rutas protegidas
router.get('/:clienteId', [verificarToken, verificarPropietario], getClienteById);
router.put('/:clienteId', [verificarToken, verificarPropietario], updateCliente);
router.delete('/:clienteId', [verificarToken, verificarPropietario], deleteCliente);
router.get('/:clienteId/prestamos', [verificarToken, verificarPropietario], getPrestamosCliente);
router.get('/:clienteId/pagos', [verificarToken, verificarPropietario], getPagosCliente);
router.get('/:clienteId/resumen', [verificarToken, verificarPropietario], getResumenCliente);

// Ruta para obtener cliente por documento de identidad (solo para autenticación)
router.get('/documento/:documento', getClienteByDocumento);

export default router; 