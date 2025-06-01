import { Router } from 'express';
import { 
  getClienteById, 
  getPrestamosCliente, 
  getPagosCliente, 
  getResumenCliente,
  getClienteByDocumento,
  createCliente,
  updateCliente,
  deleteCliente,
  updateClienteProfile
} from '../controllers/clienteController.js';
import { verificarToken, verificarPropietario } from '../middleware/authMiddleware.js';

const router = Router();


// Rutas públicas


// Rutas protegidas
router.put('/profile', verificarToken, updateClienteProfile);
router.get('/:clienteId', [verificarToken, verificarPropietario], getClienteById);
router.put('/:clienteId', [verificarToken,verificarPropietario], updateCliente);
router.get('/:clienteId/prestamos', [verificarToken, verificarPropietario], getPrestamosCliente);
router.get('/:clienteId/pagos', [verificarToken, verificarPropietario], getPagosCliente);
router.get('/:clienteId/resumen', [verificarToken, verificarPropietario], getResumenCliente);

router.post('/create',verificarToken, createCliente);
router.post('/update/:id',verificarToken, updateCliente);
router.post('/delete/:id', [verificarToken], deleteCliente);

// Ruta para obtener cliente por documento de identidad (solo para autenticación)
router.get('/documento/:documento', getClienteByDocumento);

export default router; 