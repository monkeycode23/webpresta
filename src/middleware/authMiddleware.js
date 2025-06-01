import jwt from 'jsonwebtoken';
import Cliente from '../models/cliente.js';
import User from '../models/user.js';
const JWT_SECRET = process.env.JWT_SECRET || 'prestaweb-secret-key';


export const esAdmin = async (req, res, next) => {
  const user = req.user;
  if (!user.isAdmin) {
    return res.status(403).json({ mensaje: 'Acceso denegado. No tienes permisos de administrador.' });
  }
  next();
};

/**
 * Middleware para verificar el token de autenticación
 */
export const verificarToken = async (req, res, next) => {
  try {
    // Obtener el token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
    }
    
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    //console.log("decoded",decoded)
    // Buscar el cliente
    const id = typeof  decoded.id === "number" ? {sqlite_id:decoded.id} : {_id:decoded.id};
    const cliente = await Cliente.findOne(id);
    const user = await User.findOne(id);

    //console.log("cliente",cliente,"user",user)
    if(!cliente && !user){
      return res.status(401).json({ mensaje: 'Cliente o usuario no encontrado.' });
    }

    if(cliente){
      req.cliente = cliente;
      req.clienteId = cliente._id;
    }
    if(user){
      req.user = user;
      req.userId = user._id;
    }
    
  /*   
    if (!cliente.activo) {
      return res.status(401).json({ mensaje: 'La cuenta de este cliente está desactivada.' });
    } */
    
    // Agregar el cliente al objeto de solicitud
    next();
  } catch (error) {
    
    console.error('Error de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({type:"error", mensaje: 'Token inválido.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({type:"error", mensaje: 'Token expirado.' });
    }
    
    res.status(500).json({type:"error", mensaje: 'Error del servidor.' });
  }
};

/**
 * Middleware para verificar que el cliente acceda solo a sus propios recursos
 */
export const verificarPropietario = (req, res, next) => {
  try {
    const clienteIdParam = req.params.clienteId;
    //console.log(req.params)
    const clienteIdAuth = req.clienteId.toString();
    
    if (clienteIdParam !== clienteIdAuth) {
      return res.status(403).json({ 
        mensaje: 'No tienes permiso para acceder a los recursos de otro cliente.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error al verificar propietario:', error);
    res.status(500).json({ mensaje: 'Error del servidor.' });
  }
}; 