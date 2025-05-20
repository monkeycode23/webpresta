import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Cliente from '../models/cliente.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'prestaweb-secret-key';
const TOKEN_EXPIRATION = '7d'; // Una semana

// Login de cliente
router.post('/login', async (req, res) => {
  try {
    const { codigoAcceso, password } = req.body;
    
    if (!codigoAcceso ) {
      return res.status(400).json({ 
        mensaje: 'Por favor proporciona código de acceso y contraseña' 
      });
    }
    
    // Buscar cliente por código de acceso
    const cliente = await Cliente.findOne({ codigoAcceso: codigoAcceso });
    
    console.log(cliente);
    if (!cliente) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    /* const passwordValida = await bcrypt.compare(password, cliente.password);
    
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    } */
    
    // Verificar si la cuenta está activa
   /*  if (!cliente.activo) {
      return res.status(401).json({ mensaje: 'La cuenta está desactivada' });
    } */
    
    // Generar token JWT 
    const token = jwt.sign(
      { id: cliente._id, codigoAcceso: cliente.codigoAcceso },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );
    
    // Devolver datos del cliente y token
    res.json({
      token,
      cliente: {
        id: cliente._id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email,
        codigoAcceso: cliente.codigoAcceso
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Verificar token (para validar sesión en frontend)
router.get('/verificar', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ valid: false });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar cliente
    const cliente = await Cliente.findById(decoded.id);
    
    if (!cliente || !cliente.activo) {
      return res.status(401).json({ valid: false });
    }
    
    // Devolver información del cliente
    res.json({
      valid: true,
      cliente: {
        id: cliente._id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email,
        codigoAcceso: cliente.codigoAcceso
      }
    });
  } catch (error) {
    return res.status(401).json({ valid: false });
  }
});

// Establecer contraseña (primera vez o recuperación)
router.post('/set-password', async (req, res) => {
  try {
    const { documento, codigo, password } = req.body;
    
    if (!documento || !codigo || !password) {
      return res.status(400).json({ 
        mensaje: 'Documento, código y contraseña son requeridos' 
      });
    }
    
    // Buscar cliente por documento
    const cliente = await Cliente.findOne({ documentoIdentidad: documento });
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    // Aquí verificaríamos un código de activación que se enviaría por correo o SMS
    // Este es un ejemplo simple, en una aplicación real se implementaría más seguridad
    
    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Actualizar contraseña
    cliente.password = hashedPassword;
    await cliente.save();
    
    res.json({ mensaje: 'Contraseña establecida con éxito' });
  } catch (error) {
    console.error('Error al establecer contraseña:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

export default router; 