import Cliente from '../models/cliente.js';
import Prestamo from '../models/prestamo.js';
import Pago from '../models/pago.js';

// Obtener cliente por ID
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findById(id);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener préstamos de un cliente
export const getPrestamosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    const prestamos = await Prestamo.find({ client_id: clienteId }).populate('payments');
    
    res.json(prestamos);
  } catch (error) {
    console.error('Error al obtener préstamos del cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener pagos de un cliente
export const getPagosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    const pagos = await Pago.find({ cliente: clienteId }).populate('prestamo');
    
    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos del cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener resumen de préstamos y pagos del cliente
export const getResumenCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    // Obtener préstamos
    const prestamos = await Prestamo.find({ client_id: clienteId }).populate('payments');
    
    // Obtener pagos
    
    //const pagos = await prestamos.find({ loan_id: clienteId }).
    
  
  
    // Calcular totales
    const totalPrestamos = prestamos.length;
    const totalPrestado = prestamos.reduce((sum, prestamo) => sum + prestamo.amount, 0);
    //console.log(totalPagado);
    const totalPendiente = prestamos.reduce((sum, prestamo) => sum + 
    prestamo.payments.filter(pago => pago.status !== 'Completado').reduce((sum, pago) => sum + pago.amount, 0)
    , 0);
    const totalPagado = totalPrestado - totalPendiente;
 
   
   
    // Crear resumen
    const resumen = {
      cliente,
      prestamos: {
        prestamos: prestamos,
        total: totalPrestamos,
        activos: prestamos.filter(p => p.status !== 'Pagado').length,
        pagados: prestamos.filter(p => p.status === 'Pagado').length
      },
      montos: {
        totalPrestado,
        totalPagado,
        totalPendiente
      },
      pagosRecientes: prestamos.flatMap(prestamo => prestamo.payments)
    };
    
    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen del cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener cliente por documento de identidad
export const getClienteByDocumento = async (req, res) => {
  try {
    const { documento } = req.params;
    
    const cliente = await Cliente.findOne({ documentoIdentidad: documento });
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente por documento:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Crear nuevo cliente
export const createCliente = async (req, res) => {
  try {
    const clienteData = req.body;
    
    // Generar código de acceso único de 5 dígitos si no se proporciona
    if (!clienteData.codigoAcceso) {
      // Generar un número aleatorio entre 10000 y 99999
      clienteData.codigoAcceso = Math.floor(10000 + Math.random() * 90000).toString();
    }
    
    const cliente = new Cliente(clienteData);
    const savedCliente = await cliente.save();
    
    res.status(201).json(savedCliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar cliente
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const cliente = await Cliente.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar perfil del cliente autenticado
export const updateClienteProfile = async (req, res) => {
  try {
    const clienteId = req.clienteId; // Obtenido del token JWT
    const { nombre, apellido, telefono,email, direccion, cbu, aliasCbu } = req.body;

    console.log(req.body)
    const updateData = {
      name: nombre,
      lastname: apellido,
      email,
      phone: telefono,
      address: direccion,
      cbu,
      aliasCbu,
    };

    // Filtrar campos undefined para no sobrescribir con null
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    /* if (cbu) {
      // Verificar si el CBU ya está en uso por otro cliente
      const existingCbu = await Cliente.findOne({ cbu: cbu, _id: { $ne: clienteId } });
      if (existingCbu) {
        return res.status(400).json({ mensaje: 'El CBU ingresado ya está registrado por otro usuario.' });
      }
    } */

    const clienteActualizado = await Cliente.findByIdAndUpdate(
      clienteId,
      { $set: updateData },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!clienteActualizado) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Perfil actualizado correctamente', cliente: clienteActualizado });
  } catch (error) {
    console.error('Error al actualizar perfil del cliente:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.cbu) {
      return res.status(400).json({ mensaje: 'El CBU ingresado ya está en uso.' });
    }
    res.status(500).json({ mensaje: 'Error del servidor al actualizar el perfil' });
  }
};

// Eliminar cliente
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el cliente tiene préstamos activos
    const prestamosActivos = await Prestamo.find({
      client_id: id,
      status: { $in: ['En curso', 'Aprobado'] }
    });
    
    if (prestamosActivos.length > 0) {
      return res.status(400).json({
        mensaje: 'No se puede eliminar el cliente porque tiene préstamos activos'
      });
    }
    
    const cliente = await Cliente.findByIdAndDelete(id);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }
    
    res.json({ mensaje: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
}; 